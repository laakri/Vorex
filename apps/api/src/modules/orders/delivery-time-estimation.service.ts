import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BatchType, OrderStatus } from '@prisma/client';

@Injectable()
export class DeliveryTimeEstimationService {
  private readonly logger = new Logger(DeliveryTimeEstimationService.name);

  // Constants for estimation calculations
  private readonly AVERAGE_SPEED_KMH = {
    LOCAL: 30, // Average speed for local deliveries (km/h)
    INTERCITY: 60, // Average speed for intercity deliveries (km/h)
  };

  private readonly STOP_TIME_MINUTES = {
    PICKUP: 15, // Time to pick up an order (minutes)
    DELIVERY: 10, // Time to deliver an order (minutes)
    WAREHOUSE: 30, // Time to process at warehouse (minutes)
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate the estimated delivery time for an order
   * @param orderId The ID of the order
   * @returns The estimated delivery time as a Date object
   */
  async calculateEstimatedDeliveryTime(orderId: string): Promise<Date> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        seller: true,
        warehouse: true,
        batch: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Start with the order creation time
    const startTime = new Date(order.createdAt);
    
    // Calculate based on delivery type
    if (order.isLocalDelivery) {
      return this.estimateLocalDeliveryTime(order, startTime);
    } else {
      return this.estimateIntercityDeliveryTime(order, startTime);
    }
  }

  /**
   * Estimate delivery time for local deliveries
   */
  private async estimateLocalDeliveryTime(order: any, startTime: Date): Promise<Date> {
    // For local deliveries, we need to consider:
    // 1. Distance from seller to customer
    // 2. Number of items and their handling requirements
    // 3. Traffic conditions (simplified)
    
    // Calculate distance if coordinates are available
    let distanceKm = 0;
    if (order.pickupLatitude && order.pickupLongitude && 
        order.dropLatitude && order.dropLongitude) {
      distanceKm = this.calculateDistance(
        order.pickupLatitude,
        order.pickupLongitude,
        order.dropLatitude,
        order.dropLongitude
      );
    } else {
      // Default distance if coordinates not available
      distanceKm = 5; // Assume 5km for local delivery
    }
    
    // Calculate travel time in hours
    const travelTimeHours = distanceKm / this.AVERAGE_SPEED_KMH.LOCAL;
    
    // Calculate handling time based on items
    const handlingTimeMinutes = this.calculateHandlingTime(order.items);
    
    // Add buffer for traffic (20% of travel time)
    const trafficBufferMinutes = travelTimeHours * 60 * 0.2;
    
    // Total time in minutes
    const totalTimeMinutes = 
      (travelTimeHours * 60) + // Travel time
      handlingTimeMinutes + // Handling time
      trafficBufferMinutes; // Traffic buffer
    
    // Create estimated delivery time
    const estimatedTime = new Date(startTime);
    estimatedTime.setMinutes(estimatedTime.getMinutes() + totalTimeMinutes);
    
    return estimatedTime;
  }

  /**
   * Estimate delivery time for intercity deliveries
   */
  private async estimateIntercityDeliveryTime(order: any, startTime: Date): Promise<Date> {
    // For intercity deliveries, we need to consider:
    // 1. Distance from seller to source warehouse
    // 2. Processing time at source warehouse
    // 3. Distance between warehouses
    // 4. Processing time at destination warehouse
    // 5. Distance from destination warehouse to customer
    
    let estimatedTime = new Date(startTime);
    
    // Step 1: Seller to source warehouse (if coordinates available)
    if (order.pickupLatitude && order.pickupLongitude && 
        order.warehouse?.latitude && order.warehouse?.longitude) {
      const distanceToWarehouse = this.calculateDistance(
        order.pickupLatitude,
        order.pickupLongitude,
        order.warehouse.latitude,
        order.warehouse.longitude
      );
      
      const travelTimeToWarehouse = (distanceToWarehouse / this.AVERAGE_SPEED_KMH.LOCAL) * 60;
      estimatedTime.setMinutes(estimatedTime.getMinutes() + travelTimeToWarehouse);
    } else {
      // Default time if coordinates not available
      estimatedTime.setMinutes(estimatedTime.getMinutes() + 30);
    }
    
    // Step 2: Processing at source warehouse
    estimatedTime.setMinutes(estimatedTime.getMinutes() + this.STOP_TIME_MINUTES.WAREHOUSE);
    
    // Step 3: Intercity travel (if secondary warehouse is available)
    if (order.secondaryWarehouseId) {
      const secondaryWarehouse = await this.prisma.warehouse.findUnique({
        where: { id: order.secondaryWarehouseId }
      });
      
      if (secondaryWarehouse && order.warehouse) {
        const intercityDistance = this.calculateDistance(
          order.warehouse.latitude,
          order.warehouse.longitude,
          secondaryWarehouse.latitude,
          secondaryWarehouse.longitude
        );
        
        const intercityTravelTime = (intercityDistance / this.AVERAGE_SPEED_KMH.INTERCITY) * 60;
        estimatedTime.setMinutes(estimatedTime.getMinutes() + intercityTravelTime);
      } else {
        // Default intercity travel time
        estimatedTime.setHours(estimatedTime.getHours() + 4);
      }
    } else {
      // Default intercity travel time
      estimatedTime.setHours(estimatedTime.getHours() + 4);
    }
    
    // Step 4: Processing at destination warehouse
    estimatedTime.setMinutes(estimatedTime.getMinutes() + this.STOP_TIME_MINUTES.WAREHOUSE);
    
    // Step 5: Destination warehouse to customer
    if (order.dropLatitude && order.dropLongitude && 
        order.secondaryWarehouseId) {
      const secondaryWarehouse = await this.prisma.warehouse.findUnique({
        where: { id: order.secondaryWarehouseId }
      });
      
      if (secondaryWarehouse) {
        const distanceToCustomer = this.calculateDistance(
          secondaryWarehouse.latitude,
          secondaryWarehouse.longitude,
          order.dropLatitude,
          order.dropLongitude
        );
        
        const travelTimeToCustomer = (distanceToCustomer / this.AVERAGE_SPEED_KMH.LOCAL) * 60;
        estimatedTime.setMinutes(estimatedTime.getMinutes() + travelTimeToCustomer);
      } else {
        // Default time if secondary warehouse not found
        estimatedTime.setMinutes(estimatedTime.getMinutes() + 45);
      }
    } else {
      // Default time if coordinates not available
      estimatedTime.setMinutes(estimatedTime.getMinutes() + 45);
    }
    
    // Add handling time for items
    const handlingTimeMinutes = this.calculateHandlingTime(order.items);
    estimatedTime.setMinutes(estimatedTime.getMinutes() + handlingTimeMinutes);
    
    return estimatedTime;
  }

  /**
   * Calculate handling time based on order items
   */
  private calculateHandlingTime(items: any[]): number {
    let totalHandlingTime = 0;
    
    for (const item of items) {
      // Base handling time per item
      let itemHandlingTime = 5; // 5 minutes per item
      
      // Add time for fragile items
      if (item.fragile) {
        itemHandlingTime += 5; // Extra 5 minutes for fragile items
      }
      
      // Add time for perishable items
      if (item.perishable) {
        itemHandlingTime += 3; // Extra 3 minutes for perishable items
      }
      
      // Multiply by quantity
      totalHandlingTime += itemHandlingTime * item.quantity;
    }
    
    return totalHandlingTime;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update the estimated delivery time for an order
   */
  async updateOrderEstimatedDeliveryTime(orderId: string): Promise<void> {
    const estimatedTime = await this.calculateEstimatedDeliveryTime(orderId);
    
    await this.prisma.order.update({
      where: { id: orderId },
      data: { estimatedDeliveryTime: estimatedTime }
    });
    
    this.logger.log(`Updated estimated delivery time for order ${orderId} to ${estimatedTime}`);
  }

  /**
   * Update estimated delivery times for all orders in a batch
   */
  async updateBatchEstimatedDeliveryTimes(batchId: string): Promise<void> {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { orders: true }
    });
    
    if (!batch) {
      throw new NotFoundException(`Batch with ID ${batchId} not found`);
    }
    
    // For each order in the batch, update its estimated delivery time
    for (const order of batch.orders) {
      await this.updateOrderEstimatedDeliveryTime(order.id);
    }
  }
} 