import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DriverEarningsService {
  private readonly logger = new Logger(DriverEarningsService.name);

  // Default percentage for driver earnings - reduced from 70% to 40%
  private readonly DEFAULT_DRIVER_PERCENTAGE = 40;

  // Simplified bonus factors - only keeping essential ones
  private readonly BONUS_FACTORS = {
    DISTANCE: 0.2, // DT per km (reduced from 0.5)
    STOP_COUNT: 1, // DT per stop (reduced from 2)
    SPECIAL_HANDLING: 2, // DT for fragile or perishable items (reduced from 5)
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate driver earnings for a completed delivery
   * @param orderId The ID of the completed order
   * @param routeId The ID of the delivery route
   * @param batchId The ID of the batch
   * @param driverId The ID of the driver
   * @returns The created driver earnings record
   */
  async calculateAndCreateEarnings(
    orderId: string,
    routeId: string,
    batchId: string,
    driverId: string,
  ) {
    try {
      // Get the order details
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          batch: {
            include: {
              route: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Get the route details
      const route = await this.prisma.deliveryRoute.findUnique({
        where: { id: routeId },
        include: {
          stops: true,
        },
      });

      if (!route) {
        throw new Error(`Route with ID ${routeId} not found`);
      }

      // Get the batch details
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new Error(`Batch with ID ${batchId} not found`);
      }

      // Calculate base amount (percentage of delivery price)
      const baseAmount = (order.deliveryPrice * this.DEFAULT_DRIVER_PERCENTAGE) / 100;

      // Calculate bonus amounts
      const bonusAmount = await this.calculateBonusAmount(order, route, batch);

      // Calculate total amount
      const totalAmount = baseAmount + bonusAmount;

      // Create driver earnings record
      const driverEarnings = await this.prisma.driverEarnings.create({
        data: {
          driverId,
          orderId,
          routeId,
          batchId,
          baseAmount,
          bonusAmount,
          totalAmount,
          percentage: this.DEFAULT_DRIVER_PERCENTAGE,
          status: 'PENDING',
        },
      });

      this.logger.log(
        `Created driver earnings record: ${driverEarnings.id} for driver ${driverId} and order ${orderId}`,
      );

      return driverEarnings;
    } catch (error) {
      this.logger.error(
        `Error calculating driver earnings: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate bonus amount based on simplified factors
   */
  private async calculateBonusAmount(order: any, route: any, batch: any): Promise<number> {
    let bonusAmount = 0;

    // Distance bonus
    if (route.totalDistance) {
      bonusAmount += route.totalDistance * this.BONUS_FACTORS.DISTANCE;
    }

    // Stop count bonus
    if (route.stops && route.stops.length > 0) {
      bonusAmount += route.stops.length * this.BONUS_FACTORS.STOP_COUNT;
    }

    // Special handling bonus - only for fragile/perishable items
    const specialHandlingItems = order.items.filter(
      (item: any) => item.fragile || item.perishable,
    );
    if (specialHandlingItems.length > 0) {
      bonusAmount += specialHandlingItems.length * this.BONUS_FACTORS.SPECIAL_HANDLING;
    }

    return bonusAmount;
  }

  /**
   * Get earnings for a specific driver
   */
  async getDriverEarnings(driverId: string, timeRange: string = '30d', status?: string) {
    // Determine date range
    const now = new Date();
    let startDate: Date;
    
    switch(timeRange) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    // Build where clause
    const where: any = {
      driverId,
      createdAt: {
        gte: startDate,
      },
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get earnings for the specified time range
    const earnings = await this.prisma.driverEarnings.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            isLocalDelivery: true,
          },
        },
        route: {
          select: {
            id: true,
            status: true,
            totalDistance: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary statistics
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.totalAmount, 0);
    const baseAmount = earnings.reduce((sum, earning) => sum + earning.baseAmount, 0);
    const bonusAmount = earnings.reduce((sum, earning) => sum + earning.bonusAmount, 0);
    const pendingAmount = earnings
      .filter(earning => earning.status === 'PENDING')
      .reduce((sum, earning) => sum + earning.totalAmount, 0);
    const paidAmount = earnings
      .filter(earning => earning.status === 'PAID')
      .reduce((sum, earning) => sum + earning.totalAmount, 0);

    // Calculate earnings by status
    const earningsByStatus = [
      {
        status: 'PENDING',
        count: earnings.filter(e => e.status === 'PENDING').length,
        amount: pendingAmount,
      },
      {
        status: 'PAID',
        count: earnings.filter(e => e.status === 'PAID').length,
        amount: paidAmount,
      },
      {
        status: 'CANCELLED',
        count: earnings.filter(e => e.status === 'CANCELLED').length,
        amount: earnings
          .filter(e => e.status === 'CANCELLED')
          .reduce((sum, earning) => sum + earning.totalAmount, 0),
      },
    ];

    // Calculate earnings by type (local vs intercity)
    const earningsByType = [
      {
        type: 'Local',
        count: earnings.filter(e => e.order.isLocalDelivery).length,
        amount: earnings
          .filter(e => e.order.isLocalDelivery)
          .reduce((sum, earning) => sum + earning.totalAmount, 0),
      },
      {
        type: 'Intercity',
        count: earnings.filter(e => !e.order.isLocalDelivery).length,
        amount: earnings
          .filter(e => !e.order.isLocalDelivery)
          .reduce((sum, earning) => sum + earning.totalAmount, 0),
      },
    ];

    return {
      earnings,
      summary: {
        totalEarnings,
        baseAmount,
        bonusAmount,
        pendingAmount,
        paidAmount,
        earningsByStatus,
        earningsByType,
      },
    };
  }

  /**
   * Mark earnings as paid
   */
  async markEarningsAsPaid(earningsId: string) {
    return this.prisma.driverEarnings.update({
      where: { id: earningsId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  /**
   * Get earnings for a specific order
   */
  async getOrderEarnings(orderId: string) {
    return this.prisma.driverEarnings.findFirst({
      where: { orderId },
      include: {
        driver: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
              },
            },
            phone: true,
          },
        },
      },
    });
  }
} 