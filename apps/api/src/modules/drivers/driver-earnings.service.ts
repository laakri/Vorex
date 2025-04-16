import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OrderStatus, PaymentStatus, Order, DeliveryRoute, Batch, DriverEarnings } from '@prisma/client';

// Define interfaces for type safety
interface OrderWithItems extends Order {
  items: Array<{
    id: string;
    fragile: boolean;
    perishable: boolean;
  }>;
}

interface RouteWithStops extends DeliveryRoute {
  stops: Array<{
    id: string;
    isPickup: boolean;
  }>;
}

interface EarningsConfig {
  defaultDriverPercentage: number;
  bonusFactors: {
    distance: number;
    stopCount: number;
    specialHandling: number;
  };
}

@Injectable()
export class DriverEarningsService {
  private readonly logger = new Logger(DriverEarningsService.name);
  private readonly config: EarningsConfig = {
    defaultDriverPercentage: 40,
    bonusFactors: {
      distance: 0.2,
      stopCount: 1,
      specialHandling: 2,
    },
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate driver earnings for a completed delivery
   */
  async calculateAndCreateEarnings(
    orderId: string,
    routeId: string,
    batchId: string,
    driverId: string,
  ): Promise<DriverEarnings> {
    try {
      console.log('Starting earnings calculation for:', {
        orderId,
        routeId,
        batchId,
        driverId,
      });

      // Get the order details with proper typing
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

      console.log('Found order:', {
        orderId: order?.id,
        deliveryPrice: order?.deliveryPrice,
        status: order?.status,
        itemsCount: order?.items?.length,
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Get the route details with proper typing
      const route = await this.prisma.deliveryRoute.findUnique({
        where: { id: routeId },
        include: {
          stops: true,
        },
      });

      console.log('Found route:', {
        routeId: route?.id,
        totalDistance: route?.totalDistance,
        stopsCount: route?.stops?.length,
      });

      if (!route) {
        throw new NotFoundException(`Route with ID ${routeId} not found`);
      }

      // Get the batch details
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
      });

      console.log('Found batch:', {
        batchId: batch?.id,
        status: batch?.status,
      });

      if (!batch) {
        throw new NotFoundException(`Batch with ID ${batchId} not found`);
      }

      // Validate driver exists
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
      });

      console.log('Found driver:', {
        driverId: driver?.id,
        availabilityStatus: driver?.availabilityStatus,
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      // Calculate base amount (percentage of delivery price)
      const baseAmount = (order.deliveryPrice * this.config.defaultDriverPercentage) / 100;
      console.log('Calculated base amount:', {
        deliveryPrice: order.deliveryPrice,
        percentage: this.config.defaultDriverPercentage,
        baseAmount,
      });

      // Calculate bonus amounts with proper typing
      const bonusAmount = await this.calculateBonusAmount(
        order as OrderWithItems,
        route as RouteWithStops,
        batch
      );
      console.log('Calculated bonus amount:', {
        bonusAmount,
        factors: this.config.bonusFactors,
      });

      // Calculate total amount
      const totalAmount = baseAmount + bonusAmount;
      console.log('Final earnings calculation:', {
        baseAmount,
        bonusAmount,
        totalAmount,
      });

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
          percentage: this.config.defaultDriverPercentage,
          status: PaymentStatus.PENDING,
        },
      });

      console.log('Created driver earnings record:', {
        earningsId: driverEarnings.id,
        totalAmount: driverEarnings.totalAmount,
        status: driverEarnings.status,
      });

      return driverEarnings;
    } catch (error) {
      console.error('Error in calculateAndCreateEarnings:', {
        error: error.message,
        stack: error.stack,
      });
      this.logger.error(
        `Error calculating driver earnings: ${error.message}`,
        error.stack,
      );
      throw error instanceof NotFoundException 
        ? error 
        : new BadRequestException('Failed to calculate driver earnings');
    }
  }

  /**
   * Calculate bonus amount based on factors
   */
  private async calculateBonusAmount(
    order: OrderWithItems,
    route: RouteWithStops,
    batch: Batch
  ): Promise<number> {
    let bonusAmount = 0;

    // Distance bonus
    if (route.totalDistance) {
      bonusAmount += route.totalDistance * this.config.bonusFactors.distance;
    }

    // Stop count bonus
    if (route.stops && route.stops.length > 0) {
      bonusAmount += route.stops.length * this.config.bonusFactors.stopCount;
    }

    // Special handling bonus - only for fragile/perishable items
    const specialHandlingItems = order.items.filter(
      (item) => item.fragile || item.perishable,
    );
    if (specialHandlingItems.length > 0) {
      bonusAmount += specialHandlingItems.length * this.config.bonusFactors.specialHandling;
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