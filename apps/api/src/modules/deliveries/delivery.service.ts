import { Injectable, NotFoundException } from '@nestjs/common';
import { EmailService } from '@/modules/email/email.service';
import { CreateDeliveryDto, DeliveryType, VehicleType } from './dto/create-delivery.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async createDelivery(sellerId: string, createDeliveryDto: CreateDeliveryDto) {
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: createDeliveryDto.orderIds },
        sellerId
      },
      include: {
        items: true
      }
    });

    if (orders.length !== createDeliveryDto.orderIds.length) {
      throw new NotFoundException('Some orders not found');
    }

    // Calculate total weight and volume
    const totalWeight = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.weight * item.quantity, 0), 0
    );

    // Find suitable drivers based on vehicle type and delivery type
    const availableDrivers = await this.findSuitableDrivers(
      createDeliveryDto.deliveryType,
      createDeliveryDto.vehicleRequirements,
      orders[0].city, // Assuming all orders are from same location
      totalWeight
    );

    // Create delivery route
    const route = await this.createDeliveryRoute(
      orders,
      createDeliveryDto.deliveryType
    );

    // Create delivery record
    const delivery = await this.prisma.delivery.create({
      data: {
        orders: {
          connect: orders.map(order => ({ id: order.id }))
        },
        route: {
          connect: { id: route.id }
        },
        vehicleRequirements: createDeliveryDto.vehicleRequirements,
        deliveryType: createDeliveryDto.deliveryType,
        status: 'PENDING',
        notes: createDeliveryDto.notes
      },
      include: {
        orders: true,
        route: true
      }
    });

    // Notify available drivers
    await this.notifyDrivers(availableDrivers, delivery);

    return delivery;
  }

  private async findSuitableDrivers(
    deliveryType: DeliveryType,
    vehicleReqs: any,
    location: string,
    totalWeight: number
  ) {
    return this.prisma.driver.findMany({
      where: {
        availabilityStatus: 'AVAILABLE',
        vehicle: {
          type: vehicleReqs.type,
          maxWeight: { gte: totalWeight }
        },
        deliveryZones: {
          has: location
        },
        // Add more filters based on delivery type
        ...(deliveryType === DeliveryType.INTERCITY ? {
          licenseType: {
            in: ['C', 'D', 'E']
          }
        } : {})
      }
    });
  }

  private async createDeliveryRoute(orders: any[], deliveryType: DeliveryType) {
    // Implement route creation logic based on delivery type
    // For local delivery: optimize stops within city
    // For intercity: plan warehouse transfers
    return this.prisma.deliveryRoute.create({
      data: {
        // Route details
      }
    });
  }

  private async notifyDrivers(drivers: any[], delivery: any) {
    // Notify available drivers about new delivery
    await Promise.all(
      drivers.map(driver =>
        this.emailService.sendEmail({
          to: driver.email,
          subject: 'New Delivery Available',
          template: 'delivery-assigned',
          context: {
            driverName: driver.name,
            deliveryDetails: delivery
          }
        })
      )
    );
  }
} 