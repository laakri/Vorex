import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { 
  BatchStatus, 
  BatchType, 
  OrderStatus, 
  RouteStatus, 
  DeliveryStatus,
  Order,
  OrderItem,
  Prisma 
} from '@prisma/client';

// Define the type for Order with included OrderItems
type OrderWithItems = Order & {
  orderItems: Pick<OrderItem, 'quantity' | 'weight' | 'dimensions'>[];
};

interface BatchConfig {
  maxOrdersPerBatch: number;
  maxWeightPerBatch: number;
  maxVolumePerBatch: number;
  maxDistanceRadius: number;
  timeWindow: number;
}

interface BatchGroup {
  orders: OrderWithItems[];
  totalWeight: number;
  totalVolume: number;
  zone: string;
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private readonly batchConfig: BatchConfig = {
    maxOrdersPerBatch: 15,
    maxWeightPerBatch: 500,
    maxVolumePerBatch: 3000,
    maxDistanceRadius: 5,
    timeWindow: 120,
  };

  constructor(private prisma: PrismaService) {}

  @Cron('*/30 * * * *')
  async processBatches() {
    this.logger.log('Starting batch processing...');

    try {
      const pendingOrders = await this.getPendingOrders();
      
      if (pendingOrders.length === 0) {
        this.logger.log('No pending orders to process');
        return;
      }

      const ordersByWarehouse = this.groupOrdersByWarehouse(pendingOrders);

      for (const [warehouseId, orders] of Object.entries(ordersByWarehouse)) {
        await this.processBatchesForWarehouse(warehouseId, orders as OrderWithItems[]);
      }
    } catch (error) {
      this.logger.error('Error in batch processing:', error);
    }
  }

  private async getPendingOrders(): Promise<OrderWithItems[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        batchId: null,
        isLocalDelivery: false,
        warehouseId: { not: null },
      },
      include: {
        items: {
          select: {
            quantity: true,
            weight: true, 
            dimensions: true
          }
        }
      },
    });

    // Transform the result to match OrderWithItems type
    return orders.map(order => ({
      ...order,
      orderItems: order.items.map(item => ({
        quantity: item.quantity,
        weight: item.weight,
        dimensions: item.dimensions,
      }))
    }));
  }

  private groupOrdersByWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    return orders.reduce((acc, order) => {
      if (order.warehouseId) {
        if (!acc[order.warehouseId]) {
          acc[order.warehouseId] = [];
        }
        acc[order.warehouseId].push(order);
      }
      return acc;
    }, {} as Record<string, OrderWithItems[]>);
  }

  private async processBatchesForWarehouse(warehouseId: string, orders: OrderWithItems[]) {
    const ordersByZone = this.groupOrdersByDeliveryZone(orders);

    for (const [zone, zoneOrders] of Object.entries(ordersByZone)) {
      const batches = this.createOptimalBatches(zoneOrders);
      await this.assignBatchesToDrivers(warehouseId, zone, batches);
    }
  }

  private groupOrdersByDeliveryZone(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    return orders.reduce((acc, order) => {
      const zone = this.determineDeliveryZone(order);
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(order);
      return acc;
    }, {} as Record<string, OrderWithItems[]>);
  }

  private determineDeliveryZone(order: OrderWithItems): string {
    return `${order.governorate}-${order.city}`;
  }

  private createOptimalBatches(orders: OrderWithItems[]): BatchGroup[] {
    const batches: BatchGroup[] = [];
    let currentBatch: BatchGroup = {
      orders: [],
      totalWeight: 0,
      totalVolume: 0,
      zone: '',
    };

    const sortedOrders = this.sortOrdersByPriority(orders);

    for (const order of sortedOrders) {
      if (this.canAddOrderToBatch(currentBatch, order)) {
        currentBatch.orders.push(order);
        currentBatch.totalWeight += this.calculateOrderWeight(order);
        currentBatch.totalVolume += this.calculateOrderVolume(order);
        currentBatch.zone = this.determineDeliveryZone(order);
      } else {
        if (currentBatch.orders.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = {
          orders: [order],
          totalWeight: this.calculateOrderWeight(order),
          totalVolume: this.calculateOrderVolume(order),
          zone: this.determineDeliveryZone(order),
        };
      }
    }

    if (currentBatch.orders.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  private async assignBatchesToDrivers(warehouseId: string, zone: string, batches: BatchGroup[]) {
    for (const batch of batches) {
      const driver = await this.findAvailableDriver(warehouseId, zone);
      
      if (driver) {
        await this.createBatch(warehouseId, batch.orders, zone, BatchType.INTERCITY, driver.id);
      } else {
        this.logger.warn(`No available driver found for zone ${zone}`);
      }
    }
  }

  private async findAvailableDriver(warehouseId: string, zone: string) {
    return this.prisma.driver.findFirst({
      where: {
        availabilityStatus: 'AVAILABLE',
        deliveryZones: {
          has: zone,
        },
      },
    });
  }

  private async createBatch(
    warehouseId: string,
    orders: OrderWithItems[],
    zone: string,
    type: BatchType,
    driverId: string
  ) {
    const totalWeight = orders.reduce((sum, order) => 
      sum + this.calculateOrderWeight(order), 0
    );
    
    const totalVolume = orders.reduce((sum, order) => 
      sum + this.calculateOrderVolume(order), 0
    );

    const batch = await this.prisma.batch.create({
      data: {
        warehouseId,
        driverId,
        type,
        status: BatchStatus.COLLECTING,
        zone,
        totalWeight,
        totalVolume,
        orderCount: orders.length,
        orders: {
          connect: orders.map(order => ({ id: order.id }))
        }
      }
    });

    // Create delivery route for the batch
    const route = await this.prisma.deliveryRoute.create({
      data: {
        driverId,
        fromWarehouseId: warehouseId,
        status: RouteStatus.PENDING,
        toCity: orders[0].city,
        toGovernorate: orders[0].governorate,
        toAddress: orders[0].address,
        distance: 0, // Calculate this based on your requirements
        estimatedTime: 0, // Calculate this based on your requirements
        batch: {
          connect: {
            id: batch.id
          }
        }
      }
    });

    // Update batch with route
    await this.prisma.batch.update({
      where: { id: batch.id },
      data: { routeId: route.id }
    });

    // Update orders status
    await this.prisma.order.updateMany({
      where: {
        id: {
          in: orders.map(o => o.id)
        }
      },
      data: {
        status: OrderStatus.PROCESSING
      }
    });
  }

  private sortOrdersByPriority(orders: OrderWithItems[]): OrderWithItems[] {
    return [...orders].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  private canAddOrderToBatch(batch: BatchGroup, order: OrderWithItems): boolean {
    const newWeight = batch.totalWeight + this.calculateOrderWeight(order);
    const newVolume = batch.totalVolume + this.calculateOrderVolume(order);

    return (
      batch.orders.length < this.batchConfig.maxOrdersPerBatch &&
      newWeight <= this.batchConfig.maxWeightPerBatch &&
      newVolume <= this.batchConfig.maxVolumePerBatch &&
      this.isWithinDeliveryRadius(batch.orders[0], order)
    );
  }

  private calculateOrderWeight(order: OrderWithItems): number {
    return order.orderItems.reduce(
      (total, item) => total + (item.weight ?? 0) * item.quantity,
      0
    );
  }

  private calculateOrderVolume(order: OrderWithItems): number {
    return order.orderItems.reduce((total, item) => {
      if (!item.dimensions) return total;
      const [length, width, height] = item.dimensions.split('x').map(Number);
      return total + (length * width * height * item.quantity);
    }, 0);
  }

  private isWithinDeliveryRadius(order1: OrderWithItems, order2: OrderWithItems): boolean {
    // Implement distance calculation between two delivery points
    // Could use external geocoding service or pre-calculated distance matrices
    return true; // Placeholder implementation
  }
} 