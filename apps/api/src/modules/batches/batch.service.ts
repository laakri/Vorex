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
  Warehouse,
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

interface IntercityBatchConfig extends BatchConfig {
  minDistanceForIntercity: number;
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
    maxOrdersPerBatch: 50,
    minOrdersForBatch: 3,               
    maxWeightPerBatch: 2000,             
    maxVolumePerBatch: 1000000,          
    timeWindow: 1,
    maxWaitTime: 180,
    vehicleTypeThresholds: {
      MOTORCYCLE: { maxWeight: 100, maxVolume: 50000 },       
      CAR: { maxWeight: 400, maxVolume: 200000 },             
      VAN: { maxWeight: 1500, maxVolume: 600000 },            
      SMALL_TRUCK: { maxWeight: 5000, maxVolume: 2000000 },   
      LARGE_TRUCK: { maxWeight: 15000, maxVolume: 6000000 }   
    }
  };

  private readonly intercityBatchConfig: IntercityBatchConfig = {
    maxOrdersPerBatch: 80,
    minOrdersForBatch: 10,               
    maxWeightPerBatch: 10000,
    maxVolumePerBatch: 5000000,
    timeWindow: 360,
    maxWaitTime: 720,
    minDistanceForIntercity: 50,        
    vehicleTypeThresholds: {
      MOTORCYCLE: { maxWeight: 0, maxVolume: 0 },
      CAR: { maxWeight: 0, maxVolume: 0 },
      VAN: { maxWeight: 2000, maxVolume: 800000 },         
      SMALL_TRUCK: { maxWeight: 10000, maxVolume: 4000000 }, 
      LARGE_TRUCK: { maxWeight: 25000, maxVolume: 10000000 }
    }
  };

  constructor(private prisma: PrismaService) {}

  @Cron('*/30 * * * * *') // Run every 30 seconds
  async processBatches() {
    this.logger.log('Starting batch processing...');
    try {
      // Process local pickups first
      this.logger.log('Processing local pickups...');
      await this.processLocalPickups();
      
      // Process warehouse to local deliveries
      this.logger.log('Processing warehouse to local deliveries...');
      await this.processWarehouseLocalDeliveries();
      
      this.logger.log('Batch processing completed successfully');
    } catch (error) {
      this.logger.error('Error in batch processing:', error);
      throw error;
    }
  }

  @Cron('*/30 * * * * *') // Run every 30 seconds
  async processIntercityBatches() {
    this.logger.log('Starting intercity batch processing...');
    try {
      // Process intercity transfers
      this.logger.log('Processing intercity transfers...');
      await this.processIntercityTransfers();
      
      this.logger.log('Intercity batch processing completed successfully');
    } catch (error) {
      this.logger.error('Error in intercity batch processing:', error);
      throw error;
    }
  }

  private async processLocalPickups() {
    this.logger.log('Starting local pickup processing...');
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

    this.logger.log(`Found ${pendingOrders.length} pending orders for local pickup`);
    
    if (pendingOrders.length === 0) {
      this.logger.log('No pending orders found for local pickup');
      return;
    }

    // Group orders by nearest warehouse
    const ordersByWarehouse = this.groupOrdersByNearestWarehouse(pendingOrders);
    this.logger.log(`Grouped orders by warehouse: ${JSON.stringify(Object.keys(ordersByWarehouse).map(key => `${key}: ${ordersByWarehouse[key].length} orders`))}`);
    
    await this.createBatchesForOrders(
      ordersByWarehouse,
      BatchType.LOCAL_PICKUP,
      OrderStatus.LOCAL_ASSIGNED_TO_PICKUP
    );
  }

  private async processIntercityTransfers() {
    this.logger.log('Starting intercity transfer processing...');
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
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

    this.logger.log(`Found ${pendingOrders.length} pending orders for intercity transfer`);
    
    if (pendingOrders.length === 0) {
      this.logger.log('No pending orders found for intercity transfer');
      return;
    }

    // Group orders by source warehouse
    const ordersByWarehouse = this.groupOrdersBySourceWarehouse(pendingOrders);
    this.logger.log(`Grouped orders by source warehouse: ${JSON.stringify(Object.keys(ordersByWarehouse).map(key => `${key}: ${ordersByWarehouse[key].length} orders`))}`);
    
    await this.createIntercityBatchesForOrders(
      ordersByWarehouse,
      BatchType.INTERCITY,
      OrderStatus.CITY_ASSIGNED_TO_PICKUP
    );
  }

  private async processWarehouseLocalDeliveries() {
    this.logger.log('Starting warehouse local delivery processing...');
    const readyForDeliveryOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
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

    this.logger.log(`Found ${readyForDeliveryOrders.length} orders ready for local to warehouse delivery`);
    
    if (readyForDeliveryOrders.length === 0) {
      this.logger.log('No orders ready for local to warehouse delivery found');
      return;
    }

    const ordersByWarehouse = this.groupOrdersByWarehouse(readyForDeliveryOrders);
    this.logger.log(`Grouped orders by warehouse: ${JSON.stringify(Object.keys(ordersByWarehouse).map(key => `${key}: ${ordersByWarehouse[key].length} orders`))}`);
    
    await this.createBatchesForOrders(
      ordersByWarehouse,
      BatchType.LOCAL_SELLERS_WAREHOUSE,
      OrderStatus.LOCAL_ASSIGNED_TO_PICKUP
    );
  }

  private async createBatchesForOrders(
    ordersByWarehouse: Record<string, OrderWithItems[]>,
    batchType: BatchType,
    initialStatus: OrderStatus
  ) {
    this.logger.log(`Creating batches for orders by warehouse: ${JSON.stringify(Object.keys(ordersByWarehouse))}`);
    
    for (const [warehouseId, orders] of Object.entries(ordersByWarehouse)) {
      this.logger.log(`Processing warehouse ${warehouseId} with ${orders.length} orders`);
      
      // Only create batches if we have minimum orders or wait time exceeded
      if (orders.length >= this.batchConfig.minOrdersForBatch) {
        this.logger.log(`Creating optimal batches for warehouse ${warehouseId} with ${orders.length} orders`);
        const batches = this.createOptimalBatches(orders, warehouseId);
        this.logger.log(`Created ${batches.length} optimal batches`);
        
        for (const batch of batches) {
          if (batch.orders.length >= this.batchConfig.minOrdersForBatch) {
            this.logger.log(`Creating batch with ${batch.orders.length} orders, total weight: ${batch.totalWeight}, total volume: ${batch.totalVolume}`);
            await this.createBatch(batch, batchType, initialStatus);
          } else {
            this.logger.log(`Skipping batch with insufficient orders: ${batch.orders.length} < ${this.batchConfig.minOrdersForBatch}`);
          }
        }
      } else {
        // Check if any orders have exceeded wait time
        const exceededWaitTime = this.hasAnyExceededWaitTime(orders);
        if (exceededWaitTime) {
          this.logger.log(`Creating batch for orders that exceeded wait time in warehouse ${warehouseId}`);
          const batch = {
            orders,
            totalWeight: orders.reduce((sum, order) => sum + this.calculateOrderWeight(order), 0),
            totalVolume: orders.reduce((sum, order) => sum + this.calculateOrderVolume(order), 0),
            warehouseId
          };
          await this.createBatch(batch, batchType, initialStatus);
        } else {
          this.logger.log(`Not creating batches for warehouse ${warehouseId} - insufficient orders (${orders.length}) and wait time not exceeded`);
        }
      }
    }
  }

  private createOptimalBatches(
    orders: OrderWithItems[], 
    warehouseId: string
  ): BatchGroup[] {
    this.logger.log(`Creating optimal batches for ${orders.length} orders in warehouse ${warehouseId}`);
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

      this.logger.log(`Processing order ${order.id}: weight=${orderWeight}, volume=${orderVolume}`);

      if (this.canAddToBatch(currentBatch, orderWeight, orderVolume)) {
        this.logger.log(`Adding order ${order.id} to current batch`);
        currentBatch.orders.push(order);
        currentBatch.totalWeight += orderWeight;
        currentBatch.totalVolume += orderVolume;
      } else {
        this.logger.log(`Cannot add order ${order.id} to current batch, creating new batch`);
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
      this.logger.log(`Adding final batch with ${currentBatch.orders.length} orders`);
      batches.push(currentBatch);
    }

    this.logger.log(`Created ${batches.length} optimal batches`);
    return batches;
  }

  private async createBatch(batch: BatchGroup, type: BatchType, initialStatus: OrderStatus) {
    this.logger.log(`Creating batch of type ${type} with ${batch.orders.length} orders`);
    
    // Validate warehouseId
    if (!batch.warehouseId) {
      this.logger.error('Warehouse ID is null or undefined');
      throw new Error(`Warehouse ID is null or undefined.`);
    }

    const existingWarehouse = await this.prisma.warehouse.findUnique({
      where: { id: batch.warehouseId },
    });

    if (!existingWarehouse) {
      this.logger.error(`Warehouse with ID ${batch.warehouseId} does not exist`);
      throw new Error(`Warehouse with ID ${batch.warehouseId} does not exist.`);
    }

    // Determine vehicle type based on batch type and config
    const config = type === BatchType.INTERCITY ? this.intercityBatchConfig : this.batchConfig;
    const vehicleType = this.determineVehicleType(batch.totalWeight, batch.totalVolume, config);
    
    if (!vehicleType) {
      this.logger.error(`No suitable vehicle type found for weight=${batch.totalWeight}, volume=${batch.totalVolume}`);
      throw new Error(`No suitable vehicle type found for the batch requirements.`);
    }

    this.logger.log(`Determined vehicle type: ${vehicleType} for weight=${batch.totalWeight}, volume=${batch.totalVolume}`);

    try {
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
            connect: batch.orders.map(order => ({ id: order.id })),
          },
        },
      });

      this.logger.log(`Created batch ${createdBatch.id} successfully`);

      // Update order statuses
      await this.prisma.order.updateMany({
        where: {
          id: { in: batch.orders.map(o => o.id) },
        },
        data: {
          status: initialStatus,
          batchId: createdBatch.id,
        },
      });

      this.logger.log(`Updated status for ${batch.orders.length} orders to ${initialStatus}`);
    } catch (error) {
      this.logger.error('Error creating batch:', error);
      throw error;
    }
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

  private determineVehicleType(weight: number, volume: number, config: BatchConfig): VehicleType | null {
    const thresholds = config.vehicleTypeThresholds;
    
    // Check each vehicle type in order of capacity
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
    if (weight <= thresholds.LARGE_TRUCK.maxWeight && volume <= thresholds.LARGE_TRUCK.maxVolume) {
      return VehicleType.LARGE_TRUCK;
    }
    
    return null;
  }

  private groupOrdersByNearestWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    const groupedOrders: Record<string, OrderWithItems[]> = {};
    this.logger.log(`Grouping ${orders.length} orders by nearest warehouse`);
    
    for (const order of orders) {
      const warehouseId = order.warehouseId || order.secondaryWarehouseId; // Use secondary warehouse if primary is not available
      if (warehouseId) {
        if (!groupedOrders[warehouseId]) {
          groupedOrders[warehouseId] = [];
        }
        groupedOrders[warehouseId].push(order);
      } else {
        this.logger.warn(`Order ${order.id} has no warehouse assigned`);
      }
    }
    
    this.logger.log(`Grouped orders into ${Object.keys(groupedOrders).length} warehouses`);
    return groupedOrders;
  }

  private groupOrdersBySourceWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    const groupedOrders: Record<string, OrderWithItems[]> = {};
    for (const order of orders) {
      const warehouseId = order.warehouseId || order.secondaryWarehouseId; // Use secondary warehouse if primary is not available
      if (warehouseId) {
        if (!groupedOrders[warehouseId]) {
          groupedOrders[warehouseId] = [];
        }
        groupedOrders[warehouseId].push(order);
      }
    }
    return groupedOrders;
  }

  private groupOrdersByWarehouse(orders: OrderWithItems[]): Record<string, OrderWithItems[]> {
    const groupedOrders: Record<string, OrderWithItems[]> = {};
    
    for (const order of orders) {
      // Use the destination warehouse for local delivery
      const warehouseId = order.secondaryWarehouseId || order.warehouseId;
      
      if (warehouseId) {
        if (!groupedOrders[warehouseId]) {
          groupedOrders[warehouseId] = [];
        }
        groupedOrders[warehouseId].push(order);
      } else {
        this.logger.warn(`Order ${order.id} has no warehouse assigned`);
      }
    }
    
    return groupedOrders;
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

  private async findWarehouse(sellerLocation: { governorate: string }, buyerLocation: { governorate: string }): Promise<Warehouse | null> {
    const warehouses = await this.prisma.warehouse.findMany();

    // Check for a warehouse that covers the seller's and buyer's governorates
    const suitableWarehouse = warehouses.find(warehouse => 
      warehouse.coverageGovernorate.includes(sellerLocation.governorate) &&
      warehouse.coverageGovernorate.includes(buyerLocation.governorate)
    );

    return suitableWarehouse || null; // Return the found warehouse or null if none found
  }

  private async createIntercityBatchesForOrders(
    ordersByWarehouse: Record<string, OrderWithItems[]>,
    batchType: BatchType,
    initialStatus: OrderStatus
  ) {
    this.logger.log(`Creating intercity batches for orders by warehouse`);
    
    for (const [warehouseId, orders] of Object.entries(ordersByWarehouse)) {
      this.logger.log(`Processing warehouse ${warehouseId} with ${orders.length} orders`);
      
      if (orders.length >= this.intercityBatchConfig.minOrdersForBatch) {
        const batches = this.createOptimalIntercityBatches(orders, warehouseId);
        this.logger.log(`Created ${batches.length} optimal intercity batches`);
        
        for (const batch of batches) {
          if (batch.orders.length >= this.intercityBatchConfig.minOrdersForBatch) {
            this.logger.log(`Creating intercity batch with ${batch.orders.length} orders, total weight: ${batch.totalWeight}, total volume: ${batch.totalVolume}`);
            await this.createBatch(batch, batchType, initialStatus);
          }
        }
      } else {
        const exceededWaitTime = this.hasAnyExceededWaitTime(orders);
        if (exceededWaitTime) {
          this.logger.log(`Creating intercity batch for orders that exceeded wait time`);
          const batch = {
            orders,
            totalWeight: orders.reduce((sum, order) => sum + this.calculateOrderWeight(order), 0),
            totalVolume: orders.reduce((sum, order) => sum + this.calculateOrderVolume(order), 0),
            warehouseId
          };
          await this.createBatch(batch, batchType, initialStatus);
        } else {
          this.logger.log(`Not creating intercity batches - insufficient orders (${orders.length}) and wait time not exceeded`);
        }
      }
    }
  }

  private createOptimalIntercityBatches(orders: OrderWithItems[], warehouseId: string): BatchGroup[] {
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

      if (
        currentBatch.orders.length >= this.intercityBatchConfig.maxOrdersPerBatch ||
        currentBatch.totalWeight + orderWeight > this.intercityBatchConfig.maxWeightPerBatch ||
        currentBatch.totalVolume + orderVolume > this.intercityBatchConfig.maxVolumePerBatch
      ) {
        if (currentBatch.orders.length >= this.intercityBatchConfig.minOrdersForBatch) {
          batches.push(currentBatch);
        }
        currentBatch = {
          orders: [],
          totalWeight: 0,
          totalVolume: 0,
          warehouseId
        };
      }

      currentBatch.orders.push(order);
      currentBatch.totalWeight += orderWeight;
      currentBatch.totalVolume += orderVolume;
    }

    if (
      currentBatch.orders.length >= this.intercityBatchConfig.minOrdersForBatch
    ) {
      batches.push(currentBatch);
    }

    return batches;
  }
}