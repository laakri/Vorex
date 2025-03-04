import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { 
  BatchStatus, 
  BatchType, 
  OrderStatus, 
  Order,
  OrderItem,
  VehicleType,
  Batch,
} from '@prisma/client';

type OrderWithItems = Order & {
  items: Pick<OrderItem, 'quantity' | 'weight' | 'dimensions'>[];
};

interface BatchConfig {
  maxOrdersPerBatch: number;
  minOrdersForBatch: number;
  maxWeightPerBatch: number;
  maxVolumePerBatch: number;
  timeWindow: number;
  maxWaitTime: number;
  vehicleTypeThresholds: Record<VehicleType, { maxWeight: number; maxVolume: number }>;
}

interface BatchGroup {
  orders: OrderWithItems[];
  totalWeight: number;
  totalVolume: number;
  warehouseId: string;
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private readonly batchConfig: BatchConfig = {
    maxOrdersPerBatch: 15,
    minOrdersForBatch: 3,
    maxWeightPerBatch: 500,
    maxVolumePerBatch: 3000,
    timeWindow: 120,
    maxWaitTime: 180,
    vehicleTypeThresholds: {
      MOTORCYCLE: { maxWeight: 50, maxVolume: 100 },
      CAR: { maxWeight: 200, maxVolume: 400 },
      VAN: { maxWeight: 800, maxVolume: 1500 },
      SMALL_TRUCK: { maxWeight: 2000, maxVolume: 4000 },
      LARGE_TRUCK: { maxWeight: 5000, maxVolume: 10000 }
    }
  };

  constructor(private prisma: PrismaService) {}

  @Cron('*/30 * * * *')
  async processBatches() {
    this.logger.log('Starting batch processing...');
    try {
      await this.processLocalPickups();
      await this.processIntercityTransfers();
      await this.processLocalDeliveries();
    } catch (error) {
      this.logger.error('Error processing batches:', error);
    }
  }

  private async processLocalPickups() {
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        batchId: null,
        isLocalDelivery: true
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const ordersByWarehouse = this.groupOrdersByNearestWarehouse(pendingOrders);
    await this.createBatchesForOrders(ordersByWarehouse, BatchType.LOCAL_PICKUP, OrderStatus.LOCAL_ASSIGNED_TO_PICKUP);
  }

  private async processIntercityTransfers() {
    const readyForTransferOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER,
        batchId: null,
        isLocalDelivery: false
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const ordersByWarehouse = this.groupOrdersBySourceWarehouse(readyForTransferOrders);
    await this.createBatchesForOrders(ordersByWarehouse, BatchType.INTERCITY, OrderStatus.CITY_IN_TRANSIT_TO_WAREHOUSE);
  }

  private async processLocalDeliveries() {
    const readyForDeliveryOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE,
        batchId: null
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const ordersByWarehouse = this.groupOrdersByDestinationWarehouse(readyForDeliveryOrders);
    await this.createBatchesForOrders(ordersByWarehouse, BatchType.LOCAL_DELIVERY, OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY);
  }

  private async createBatchesForOrders(
    ordersByWarehouse: Record<string, OrderWithItems[]>,
    batchType: BatchType,
    initialStatus: OrderStatus
  ) {
    for (const [warehouseId, orders] of Object.entries(ordersByWarehouse)) {
      if (orders.length >= this.batchConfig.minOrdersForBatch || 
          this.hasAnyExceededWaitTime(orders)) {
        const batches = this.createOptimalBatches(orders, warehouseId);
        for (const batch of batches) {
          await this.createBatch(batch, batchType, initialStatus);
        }
      }
    }
  }

  private createOptimalBatches(
    orders: OrderWithItems[], 
    warehouseId: string
  ): BatchGroup[] {
    const batches: BatchGroup[] = [];
    let currentBatch: BatchGroup = {
      orders: [],
      totalWeight: 0,
      totalVolume: 0,
      warehouseId
    };

    for (const order of orders) {
      const orderWeight = this.calculateOrderWeight(order);
      const orderVolume = this.calculateOrderVolume(order);

      if (this.canAddToBatch(currentBatch, orderWeight, orderVolume)) {
        currentBatch.orders.push(order);
        currentBatch.totalWeight += orderWeight;
        currentBatch.totalVolume += orderVolume;
      } else {
        if (currentBatch.orders.length > 0) {
          batches.push(currentBatch);
        }
        currentBatch = {
          orders: [order],
          totalWeight: orderWeight,
          totalVolume: orderVolume,
          warehouseId
        };
      }
    }

    if (currentBatch.orders.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  private async createBatch(batch: BatchGroup, type: BatchType, initialStatus: OrderStatus) {
    const vehicleType = this.determineVehicleType(batch.totalWeight, batch.totalVolume);

    const createdBatch = await this.prisma.batch.create({
      data: {
        warehouseId: batch.warehouseId,
        type,
        status: BatchStatus.COLLECTING,
        totalWeight: batch.totalWeight,
        totalVolume: batch.totalVolume,
        orderCount: batch.orders.length,
        vehicleType,
        orders: {
          connect: batch.orders.map(order => ({ id: order.id }))
        }
      }
    });

    // Update order statuses
    await this.prisma.order.updateMany({
      where: {
        id: { in: batch.orders.map(o => o.id) }
      },
      data: { 
        status: initialStatus,
        batchId: createdBatch.id
      }
    });
  }

  // Helper methods remain unchanged
  private hasExceededWaitTime(createdAt: Date): boolean {
    return (Date.now() - createdAt.getTime()) >= this.batchConfig.maxWaitTime * 60 * 1000;
  }

  private hasAnyExceededWaitTime(orders: OrderWithItems[]): boolean {
    return orders.some(order => this.hasExceededWaitTime(order.createdAt));
  }

  private calculateOrderWeight(order: OrderWithItems): number {
    return order.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
  }

  private calculateOrderVolume(order: OrderWithItems): number {
    return order.items.reduce((total, item) => {
      const [length, width, height] = item.dimensions.split('x').map(Number);
      return total + (length * width * height * item.quantity);
    }, 0);
  }

  private canAddToBatch(batch: BatchGroup, weight: number, volume: number): boolean {
    const newWeight = batch.totalWeight + weight;
    const newVolume = batch.totalVolume + volume;
    const newCount = batch.orders.length + 1;

    return newWeight <= this.batchConfig.maxWeightPerBatch &&
           newVolume <= this.batchConfig.maxVolumePerBatch &&
           newCount <= this.batchConfig.maxOrdersPerBatch;
  }

  private determineVehicleType(weight: number, volume: number): VehicleType {
    const thresholds = this.batchConfig.vehicleTypeThresholds;
    
    if (weight <= thresholds.MOTORCYCLE.maxWeight && volume <= thresholds.MOTORCYCLE.maxVolume) {
      return VehicleType.MOTORCYCLE;
    }
    if (weight <= thresholds.CAR.maxWeight && volume <= thresholds.CAR.maxVolume) {
      return VehicleType.CAR;
    }
    if (weight <= thresholds.VAN.maxWeight && volume <= thresholds.VAN.maxVolume) {
      return VehicleType.VAN;
    }
    if (weight <= thresholds.SMALL_TRUCK.maxWeight && volume <= thresholds.SMALL_TRUCK.maxVolume) {
      return VehicleType.SMALL_TRUCK;
    }
    return VehicleType.LARGE_TRUCK;
  }

  private groupOrdersByNearestWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    // Implementation depends on your warehouse coverage logic
    return {};
  }

  private groupOrdersBySourceWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    return orders.reduce((groups, order) => {
      const warehouseId = order.warehouseId!;
      if (!groups[warehouseId]) {
        groups[warehouseId] = [];
      }
      groups[warehouseId].push(order);
      return groups;
    }, {} as Record<string, OrderWithItems[]>);
  }

  private groupOrdersByDestinationWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    // Similar to groupOrdersBySourceWarehouse but using destination warehouse
    return {};
  }

  async getBatches() {
    return this.prisma.batch.findMany({
      include: {
        orders: true, // Include related orders
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date
      },
    });
  }
}