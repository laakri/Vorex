import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma, OrderStatus, BatchType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Governorate, WAREHOUSE_COVERAGE } from '@/config/constants';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliveryPricingService } from './delivery-pricing.service';
import { DeliveryTimeEstimationService } from './delivery-time-estimation.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private readonly deliveryPricingService: DeliveryPricingService,
    private readonly deliveryTimeEstimationService: DeliveryTimeEstimationService
  ) {}

  private isLocalDelivery(sellerGovernorate: string, buyerGovernorate: string): boolean {
    const sellerWarehouse = Object.values(WAREHOUSE_COVERAGE).find(warehouse => 
      warehouse.covers.includes(sellerGovernorate as Governorate)
    );

    const buyerWarehouse = Object.values(WAREHOUSE_COVERAGE).find(warehouse => 
      warehouse.covers.includes(buyerGovernorate as Governorate)
    );

    return sellerWarehouse === buyerWarehouse;
  }

  private async getWarehouseId(sellerGovernorate: string): Promise<string | null> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        coverageGovernorate: {
          has: sellerGovernorate,
        },
      },
    });

    return warehouse ? warehouse.id : null; // Return the warehouse ID or null if not found
  }

  private async getSecondaryWarehouseId(buyerGovernorate: string): Promise<string | null> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        coverageGovernorate: {
          has: buyerGovernorate,
        },
      },
    });

    return warehouse ? warehouse.id : null; // Return the warehouse ID or null if not found
  }

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      const seller = await this.prisma.seller.findUnique({
        where: { userId },
        select: {
          id: true,
          governorate: true,
          latitude: true,
          longitude: true,
        }
      });

      if (!seller) {
        throw new NotFoundException('Seller not found');
      }

      const isLocal = this.isLocalDelivery(seller.governorate, createOrderDto.governorate);

      // Determine warehouse IDs based on seller and buyer locations
      const warehouseId = await this.getWarehouseId(seller.governorate);
      const secondaryWarehouseId = await this.getSecondaryWarehouseId(createOrderDto.governorate);

      // Calculate delivery price
      const deliveryPricePreview = await this.deliveryPricingService.calculateDeliveryPricePreview(
        userId,
        createOrderDto.items.map(item => ({
          weight: item.weight,
          dimensions: item.dimensions,
          quantity: item.quantity,
          fragile: item.fragile,
          perishable: item.perishable,
        })),
        createOrderDto.governorate
      );

      // First create the order and update stock in a transaction
      const order = await this.prisma.$transaction(async (prisma) => {
        const order = await prisma.order.create({
          data: {
            sellerId: seller.id,
            customerName: createOrderDto.customerName,
            customerEmail: createOrderDto.customerEmail,
            address: createOrderDto.address,
            city: createOrderDto.city,
            governorate: createOrderDto.governorate,
            postalCode: createOrderDto.postalCode,
            phone: createOrderDto.phone,
            notes: createOrderDto.notes,
            status: 'PENDING',
            totalAmount: createOrderDto.totalAmount,
            warehouseId,
            secondaryWarehouseId,
            pickupLatitude: seller.latitude,
            pickupLongitude: seller.longitude,
            dropLatitude: createOrderDto.dropLatitude,
            dropLongitude: createOrderDto.dropLongitude,
            isLocalDelivery: isLocal,
            items: {
              create: createOrderDto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                weight: item.weight,
                dimensions: item.dimensions,
                packagingType: item.packagingType,
                fragile: item.fragile,
                perishable: item.perishable
              }))
            },
            deliveryPrice: deliveryPricePreview.finalPrice
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    stock: true
                  }
                }
              }
            }
          }
        });

        // Update stock for each item
        const stockUpdates = order.items.map(async (item) => {
          return prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        });

        await Promise.all(stockUpdates);

        // Calculate and update estimated delivery time
        await this.deliveryTimeEstimationService.updateOrderEstimatedDeliveryTime(order.id);

        return order;
      });

      // After transaction completes successfully, create notifications
      try {
        // Create order confirmation notification
        await this.notificationsService.createNotification(
          userId,
          'NEW_ORDER',  // Using the correct notification type from your enum
          'New Order Created',
          `Order #${order.id} has been created successfully for ${order.customerName}`,
          {
            orderId: order.id,
            customerName: order.customerName,
            totalAmount: order.totalAmount
          },
          order.id
        );

        // Check stock levels and create low stock notifications
        for (const item of order.items) {
          if (item.product.stock < 10) {
            await this.notificationsService.createNotification(
              userId,
              'SYSTEM_ALERT',  // Using the correct notification type from your enum
              'Low Stock Alert',
              `Your product "${item.product.name}" is running low on stock (${item.product.stock} remaining)`,
              {
                productId: item.productId,
                currentStock: item.product.stock,
                productName: item.product.name
              }
            );
          }
        }
      } catch (notificationError) {
        // Log notification error but don't fail the order creation
        console.error('Error creating notifications:', notificationError);
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Order already exists');
        }
      }
      throw new InternalServerErrorException('Could not create order');
    }
  }

  async findAll(sellerId: string) {
    try {
      console.log('Finding orders for seller:', sellerId);
      const orders = await this.prisma.order.findMany({
        where: {
          sellerId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: [
          {
            status: 'asc', // PENDING will come first
          },
          {
            createdAt: 'desc'
          }
        ]
      });

      return orders;
    } catch (error) {
      console.error('Error finding orders:', error);
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async findOne(sellerId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        sellerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  async findProducts(sellerId: string) {
    try {
      // First check if seller has any products
      const productCount = await this.prisma.product.count({
        where: { sellerId }
      });
      
      console.log(`Total products for seller ${sellerId}:`, productCount);

      if (productCount === 0) {
        return { data: [], count: 0 };
      }

      // Get products with stock
      const products = await this.prisma.product.findMany({
        where: {
          sellerId,
          stock: {
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          price: true,
          weight: true,
          dimensions: true,
          stock: true,
          sku: true,
          seller: {
            select: {
              id: true,
              businessName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Found ${products.length} products with stock`);

      return {
        data: products,
        count: products.length
      };
    } catch (error) {
      console.error('Error in findProducts:', {
        error,
        sellerId,
        message: error.message,
        code: error.code
      });
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async getPublicTrackingInfo(trackingId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: trackingId },
        include: {
          seller: {
            select: {
              businessName: true,
              city: true,
              governorate: true,
              phone: true,
              address: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              city: true,
              governorate: true,
              address: true,
              phone: true
            }
          },
          batch: {
            include: {
              driver: {
                select: {
                  id: true,
                  phone: true,
                  licenseNumber: true,
                  licenseType: true,
                  availabilityStatus: true,
                  rating: true,
                  totalDeliveries: true,
                  address: true,
                  city: true,
                  governorate: true,
                  emergencyContact: true,
                  user: {
                    select: {
                      fullName: true
                    }
                  },
                  vehicle: {
                    select: {
                      type: true,
                      make: true,
                      model: true,
                      plateNumber: true,
                      year: true,
                      capacity: true,
                      maxWeight: true,
                      currentStatus: true
                    }
                  }
                }
              },
              route: {
                select: {
                  id: true,
                  status: true,
                  estimatedDuration: true,
                  startedAt: true,
                  completedAt: true,
                  totalDistance: true,
                  stops: true
                }
              }
            }
          },
          routeStops: {
            orderBy: {
              sequenceOrder: 'asc'
            }
          },
          items: {
            select: {
              quantity: true,
              price: true,
              weight: true,
              dimensions: true,
              packagingType: true,
              fragile: true,
              perishable: true,
              product: {
                select: {
                  name: true,
                  description: true,
                  sku: true,
                  category: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order with tracking ID ${trackingId} not found`);
      }

      // Format the tracking information
      const trackingTimeline = this.buildTrackingTimeline(order);
      const currentLocation = this.determineCurrentLocation(order);
      const estimatedDelivery = this.calculateEstimatedDelivery(order);
      const routeStops = this.getFormattedRouteStops(order);
      const statusMeta = this.getOrderStatusMetadata(order.status);
      
      // Calculate delivery progress percentage
      const deliveryProgress = this.calculateDeliveryProgress(order);
      
      // Format items summary
      const itemsSummary = this.formatOrderItems(order.items);

      return {
        orderId: order.id,
        status: order.status,
        statusDescription: statusMeta.description,
        statusCategory: statusMeta.category,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customerInfo: {
          name: order.customerName,
          email: order.customerEmail,
          address: order.address,
          city: order.city,
          governorate: order.governorate,
          postalCode: order.postalCode,
          phone: order.phone
        },
        sellerInfo: {
          businessName: order.seller.businessName,
          city: order.seller.city,
          governorate: order.seller.governorate,
          phone: order.seller.phone,
          address: order.seller.address
        },
        currentLocation,
        estimatedDelivery,
        timeline: trackingTimeline,
        itemsSummary,
        deliveryProgress,
        routeStops,
        totalAmount: order.totalAmount,
        notes: order.notes,
        batchInfo: order.batch ? {
          id: order.batch.id,
          status: order.batch.status,
          driver: order.batch.driver ? {
            name: order.batch.driver.user?.fullName,
            phone: order.batch.driver.phone,
            rating: order.batch.driver.rating,
            totalDeliveries: order.batch.driver.totalDeliveries,
            licenseType: order.batch.driver.licenseType,
            status: order.batch.driver.availabilityStatus,
            vehicle: order.batch.driver.vehicle ? {
              type: order.batch.driver.vehicle.type,
              model: order.batch.driver.vehicle.model,
              make: order.batch.driver.vehicle.make,
              plateNumber: order.batch.driver.vehicle.plateNumber,
              year: order.batch.driver.vehicle.year,
              capacity: order.batch.driver.vehicle.capacity,
              status: order.batch.driver.vehicle.currentStatus
            } : null
          } : null,
          routeInfo: order.batch.route ? {
            status: order.batch.route.status,
            startedAt: order.batch.route.startedAt,
            completedAt: order.batch.route.completedAt,
            estimatedDuration: order.batch.route.estimatedDuration,
            totalDistance: order.batch.route.totalDistance,
            stops: order.batch.route.stops
          } : null
        } : null,
        warehouseInfo: order.warehouse ? {
          name: order.warehouse.name,
          address: order.warehouse.address,
          city: order.warehouse.city,
          governorate: order.warehouse.governorate,
          phone: order.warehouse.phone,
          location: `${order.warehouse.city}, ${order.warehouse.governorate}`
        } : null,
        isLocalDelivery: order.isLocalDelivery
      };
    } catch (error) {
      console.error('Error fetching tracking information:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch tracking information');
    }
  }

  private buildTrackingTimeline(order: any): any[] {
    const timeline = [
      {
        status: 'Order Created',
        timestamp: order.createdAt,
        description: 'Order has been placed successfully'
      }
    ];
    
    // Add status-based events
    if (order.status) {
      const statusEvents = this.getStatusTimelineEvents(order.status, order.updatedAt);
      if (statusEvents) {
        timeline.push(statusEvents);
      }
    }
    
    // Add route stops as timeline events if they exist and are completed
    if (order.routeStops && order.routeStops.length > 0) {
      for (const stop of order.routeStops) {
        if (stop.isCompleted && stop.completedAt) {
          timeline.push({
            status: stop.isPickup ? 'Pickup Complete' : 'Stop Complete',
            timestamp: stop.completedAt,
            description: `${stop.isPickup ? 'Pickup' : 'Delivery'} at ${stop.address}`
          });
        }
      }
    }
    
    // Sort timeline by timestamp
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private getStatusTimelineEvents(status: OrderStatus, timestamp: Date): any {
    const statusEventMap = {
      'PENDING': null, // No special event for pending
      'LOCAL_ASSIGNED_TO_PICKUP': {
        status: 'Driver Assigned',
        timestamp,
        description: 'A driver has been assigned to pick up your package'
      },
      'LOCAL_PICKED_UP': {
        status: 'Package Collected',
        timestamp,
        description: 'Your package has been picked up by our driver'
      },
      // ... map all statuses to relevant timeline events ...
    };
    
    return statusEventMap[status];
  }

  private determineCurrentLocation(order: any): any {
    // If the order is with the seller (pending or assigned for pickup)
    if (['PENDING', 'LOCAL_ASSIGNED_TO_PICKUP', 'CITY_ASSIGNED_TO_PICKUP', 'CITY_ASSIGNED_TO_PICKUP_ACCEPTED'].includes(order.status)) {
      return {
        type: 'SELLER',
        businessName: order.seller.businessName,
        city: order.seller.city,
        governorate: order.seller.governorate
      };
    }
    
    // If the order is at a warehouse
    if (['CITY_ARRIVED_AT_SOURCE_WAREHOUSE', 'CITY_READY_FOR_INTERCITY_TRANSFER', 
         'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED', 'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE',
         'CITY_READY_FOR_LOCAL_DELIVERY', 'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED'].includes(order.status) 
         && order.warehouse) {
      return {
        type: 'WAREHOUSE',
        name: order.warehouse.name,
        city: order.warehouse.city,
        governorate: order.warehouse.governorate
      };
    }
    
    // If order is with a driver (in a batch)
    if (order.batch?.driver) {
      return {
        type: 'WITH_DRIVER',
        driverName: order.batch.driver.user?.fullName || 'Driver',
        vehicleType: order.batch.driver.vehicle?.type,
        vehicleInfo: order.batch.driver.vehicle 
          ? `${order.batch.driver.vehicle.make} ${order.batch.driver.vehicle.model}` 
          : null,
        status: this.formatOrderStatus(order.status)
      };
    }
    
    // If order is pending or its status doesn't imply a specific location
    return {
      type: 'PROCESSING',
      description: this.formatOrderStatus(order.status)
    };
  }

  private formatOrderStatus(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'LOCAL_ASSIGNED_TO_PICKUP': return 'Assigned for local pickup';
      case 'LOCAL_PICKED_UP': return 'Picked up (local delivery)';
      case 'LOCAL_DELIVERED': return 'Delivered (local delivery)';
      case 'CITY_ASSIGNED_TO_PICKUP': return 'Assigned for pickup';
      case 'CITY_PICKED_UP': return 'Picked up';
      case 'CITY_IN_TRANSIT_TO_WAREHOUSE': return 'In transit to warehouse';
      case 'CITY_ARRIVED_AT_SOURCE_WAREHOUSE': return 'At source warehouse';
      case 'CITY_READY_FOR_INTERCITY_TRANSFER': return 'Ready for intercity transfer';
      case 'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE': return 'In transit to destination warehouse';
      case 'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE': return 'At destination warehouse';
      case 'CITY_READY_FOR_LOCAL_DELIVERY': return 'Ready for delivery';
      case 'CITY_DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      case 'CITY_ASSIGNED_TO_PICKUP_ACCEPTED': return 'Pickup accepted by driver';
      case 'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED': return 'Batched for intercity transfer';
      case 'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED': return 'Batched for local delivery';
      default: return status;
    }
  }

  private calculateEstimatedDelivery(order: any): Date | null {
    // If the order is already delivered or cancelled, return null
    if (['LOCAL_DELIVERED', 'CITY_DELIVERED', 'CANCELLED'].includes(order.status)) {
      return null;
    }
    
    // If the order has a route with an estimated duration
    if (order.batch?.route?.estimatedDuration) {
      // If the route has started, calculate based on start time + duration
      if (order.batch.route.startedAt) {
        const startTime = new Date(order.batch.route.startedAt);
        const durationMs = order.batch.route.estimatedDuration * 1000; // Convert seconds to milliseconds
        return new Date(startTime.getTime() + durationMs);
      }
    }
    
    // Calculate based on distance and type for pending orders
    const creationDate = new Date(order.createdAt);
    
    // More intelligent estimation based on distance and order type
    let estimatedDays = 1; // Default
    
    if (!order.isLocalDelivery) {
      // For intercity deliveries, scale based on distance if available
      if (order.totalDistance) {
        // Roughly estimate 100km per day
        estimatedDays = Math.ceil(order.totalDistance / 100) + 1;
      } else {
        estimatedDays = 3; // Default for intercity without distance info
      }
    }
    
    // For orders already in progress, reduce the estimate
    if (['CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE', 
         'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE',
         'CITY_READY_FOR_LOCAL_DELIVERY'].includes(order.status)) {
      estimatedDays = Math.max(1, estimatedDays - 1);
    }
    
    const estimatedDate = new Date(creationDate);
    estimatedDate.setDate(creationDate.getDate() + estimatedDays);
    
    // Don't deliver on weekends (optional business logic)
    const dayOfWeek = estimatedDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      estimatedDate.setDate(estimatedDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      estimatedDate.setDate(estimatedDate.getDate() + 2);
    }
    
    return estimatedDate;
  }

  private formatOrderItems(items: any[]): any {
    if (!items || items.length === 0) {
      return [];
    }
    
    return items.map(item => ({
      name: item.product.name,
      quantity: item.quantity
    }));
  }

  async updateStatus(userId: string, orderId: string, status: OrderStatus) {
    // First check if this order belongs to the seller
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    
    // Get the existing order and check ownership
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId: seller.id
      }
    });
    
    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found or doesn't belong to this seller`);
    }
    
    // Use the existing validation method
    this.validateStatusTransition(existingOrder.status, status);
    
    // Update the order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Order ${orderId} status updated from ${existingOrder.status} to ${status}`);
    
    // Recalculate estimated delivery time if relevant fields changed
    if (
      status !== existingOrder.status
    ) {
      await this.deliveryTimeEstimationService.updateOrderEstimatedDeliveryTime(orderId);
    }

    return updatedOrder;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    // Define valid status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'PENDING': ['LOCAL_ASSIGNED_TO_PICKUP', 'CITY_ASSIGNED_TO_PICKUP', 'CANCELLED'],
      'LOCAL_ASSIGNED_TO_PICKUP': ['LOCAL_PICKED_UP', 'CANCELLED'],
      'LOCAL_PICKED_UP': ['LOCAL_DELIVERED', 'CANCELLED'],
      'LOCAL_DELIVERED': [],
      'CITY_ASSIGNED_TO_PICKUP': [ 'CITY_PICKED_UP', 'CANCELLED'],
      'CITY_PICKED_UP': [ 'CANCELLED'],
      'CITY_ARRIVED_AT_SOURCE_WAREHOUSE': ['CITY_READY_FOR_INTERCITY_TRANSFER', 'CANCELLED'],
      'CITY_READY_FOR_INTERCITY_TRANSFER': ['CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED', 'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE', 'CANCELLED'],
      'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED': ['CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE', 'CANCELLED'],
      'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE': ['CITY_ARRIVED_AT_DESTINATION_WAREHOUSE', 'CANCELLED'],
      'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE': ['CITY_READY_FOR_LOCAL_DELIVERY', 'CANCELLED'],
      'CITY_READY_FOR_LOCAL_DELIVERY': ['CITY_READY_FOR_LOCAL_DELIVERY_BATCHED', 'CITY_DELIVERED', 'CANCELLED'],
      'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED': ['CITY_DELIVERED', 'CANCELLED'],
      'CITY_DELIVERED': [],
      'CANCELLED': []
    };
    
    // Check if the transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus) && currentStatus !== newStatus) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  // Add a new helper to provide more context about order status
  private getOrderStatusMetadata(status: OrderStatus): { description: string; category: string } {
    const statusMap = {
      'PENDING': { 
        description: 'Order received, waiting for processing',
        category: 'PROCESSING'
      },
      'LOCAL_ASSIGNED_TO_PICKUP': { 
        description: 'Driver assigned for local pickup',
        category: 'PICKUP'
      },
      'LOCAL_PICKED_UP': { 
        description: 'Order picked up by driver for local delivery',
        category: 'TRANSIT'
      },
      'LOCAL_DELIVERED': { 
        description: 'Order successfully delivered to the customer',
        category: 'DELIVERED'
      },
      'CITY_ASSIGNED_TO_PICKUP': { 
        description: 'A driver has been assigned to pick up your package for intercity shipping',
        category: 'PICKUP'
      },
      'CITY_ASSIGNED_TO_PICKUP_ACCEPTED': {
        description: 'Driver has accepted the pickup assignment and is on the way to seller',
        category: 'PICKUP'
      },
      'CITY_PICKED_UP': { 
        description: 'Your package has been picked up from the seller',
        category: 'PICKUP'
      },
      'CITY_IN_TRANSIT_TO_WAREHOUSE': { 
        description: 'Your package is being transported to our distribution center',
        category: 'TRANSIT'
      },
      'CITY_ARRIVED_AT_SOURCE_WAREHOUSE': { 
        description: 'Your package has arrived at our origin distribution center',
        category: 'PROCESSING'
      },
      'CITY_READY_FOR_INTERCITY_TRANSFER': { 
        description: 'Your package is ready for long-distance transport',
        category: 'PROCESSING'
      },
      'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED': {
        description: 'Your package has been grouped with others for efficient long-distance transport',
        category: 'PROCESSING'
      },
      'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE': { 
        description: 'Your package is on its way to the destination city',
        category: 'TRANSIT'
      },
      'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE': { 
        description: 'Your package has arrived at the distribution center in your city',
        category: 'PROCESSING'
      },
      'CITY_READY_FOR_LOCAL_DELIVERY': { 
        description: 'Your package is being prepared for final delivery to your address',
        category: 'PROCESSING'
      },
      'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED': {
        description: 'Your package has been assigned to a local delivery batch',
        category: 'PROCESSING'
      },
      'CITY_DELIVERED': { 
        description: 'Your package has been successfully delivered to your address',
        category: 'DELIVERED'
      },
      'CANCELLED': { 
        description: 'This order has been cancelled',
        category: 'CANCELLED'
      }
    };
    
    return statusMap[status] || { 
      description: 'Status information unavailable', 
      category: 'UNKNOWN' 
    };
  }

  private calculateDeliveryProgress(order: any): number {
    // If the order is already delivered
    if (['LOCAL_DELIVERED', 'CITY_DELIVERED'].includes(order.status)) {
      return 100;
    }
    
    // If cancelled
    if (order.status === 'CANCELLED') {
      return 0;
    }
    
    // Base calculation on status progression
    const statusProgressMap = {
      'PENDING': 5,
      'LOCAL_ASSIGNED_TO_PICKUP': 10,
      'LOCAL_PICKED_UP': 50,
      'CITY_ASSIGNED_TO_PICKUP': 10,
      'CITY_ASSIGNED_TO_PICKUP_ACCEPTED': 15,
      'CITY_PICKED_UP': 20,
      'CITY_IN_TRANSIT_TO_WAREHOUSE': 30,
      'CITY_ARRIVED_AT_SOURCE_WAREHOUSE': 40,
      'CITY_READY_FOR_INTERCITY_TRANSFER': 45,
      'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED': 50,
      'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE': 60,
      'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE': 70,
      'CITY_READY_FOR_LOCAL_DELIVERY': 80,
      'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED': 85,
    };
    
    return statusProgressMap[order.status] || 0;
  }

  private calculateRemainingDistance(order: any): number | null {
    if (!order.batch?.route?.totalDistance) {
      return null;
    }
    
    const route = order.batch.route;
    const totalDistance = route.totalDistance;
    
    // If route is completed, no distance remains
    if (route.status === 'COMPLETED') {
      return 0;
    }
    
    // If route is not started, full distance remains
    if (route.status === 'PENDING') {
      return totalDistance;
    }
    
    // If route is in progress, calculate based on completed stops
    if (route.status === 'IN_PROGRESS' && route.stops) {
      const completedStops = route.stops.filter(stop => stop.isCompleted).length;
      const totalStops = route.stops.length;
      
      if (totalStops <= 1) return totalDistance;
      
      // Calculate approximate remaining distance based on completed stops percentage
      const completionRatio = completedStops / (totalStops - 1); // -1 because we need segments not points
      return totalDistance * (1 - completionRatio);
    }
    
    return totalDistance;
  }

  private calculateDeliveryTimeWindow(order: any, estimatedDate: Date | null): { from: Date, to: Date } | null {
    if (!estimatedDate) return null;
    
    const from = new Date(estimatedDate);
    const to = new Date(estimatedDate);
    
    // For local deliveries, smaller time window
    if (order.isLocalDelivery) {
      to.setHours(to.getHours() + 2);
    } else {
      to.setHours(to.getHours() + 4);
    }
    
    return { from, to };
  }

  private getFormattedRouteStops(order: any): any[] {
    // If there are route stops directly on the order
    if (order.routeStops && order.routeStops.length > 0) {
      return order.routeStops.map(stop => ({
        id: stop.id,
        address: stop.address,
        latitude: stop.latitude,
        longitude: stop.longitude,
        isPickup: stop.isPickup,
        sequenceOrder: stop.sequenceOrder,
        isCompleted: stop.isCompleted,
        completedAt: stop.completedAt,
        notes: stop.notes
      }));
    }
    
    // If stops are available via the batch route
    if (order.batch?.route?.stops && order.batch.route.stops.length > 0) {
      return order.batch.route.stops.map(stop => ({
        id: stop.id,
        address: stop.address,
        latitude: stop.latitude,
        longitude: stop.longitude,
        isPickup: stop.isPickup,
        sequenceOrder: stop.sequenceOrder,
        isCompleted: stop.isCompleted,
        completedAt: stop.completedAt,
        notes: stop.notes
      }));
    }
    
    return [];
  }

  async getInvoiceData(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  sku: true
                }
              }
            }
          },
          seller: {
            select: {
              businessName: true,
              address: true,
              city: true,
              governorate: true,
              phone: true
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Calculate subtotal
      const subtotal = order.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
      }, 0);

      // Format items for invoice
      const formattedItems = order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }));

      return {
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.phone,
        items: formattedItems,
        subtotal,
        tax: 0, // No tax in Tunisia
        total: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        deliveryAddress: `${order.address}, ${order.city}, ${order.governorate}, ${order.postalCode}`,
        paymentMethod: 'Not specified', // Default value since paymentMethod might not exist
        sellerInfo: {
          businessName: order.seller.businessName,
          address: order.seller.address,
          city: order.seller.city,
          governorate: order.seller.governorate,
          phone: order.seller.phone
        }
      };
    } catch (error) {
      console.error('Error getting invoice data:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get invoice data');
    }
  }

  async generateInvoicePDF(orderId: string): Promise<Buffer> {
    try {
      const invoiceData = await this.getInvoiceData(orderId);
      
      return new Promise((resolve, reject) => {
        try {
          // Create a new PDF document
          const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 50,
            bufferPages: true
          });
          
          const chunks: Buffer[] = [];
          
          // Collect PDF data chunks
          doc.on('data', chunk => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);
          
          // Add company logo
          // doc.image('path/to/logo.png', 50, 45, { width: 50 });
          
          // Add invoice header
          doc.fontSize(20).text('INVOICE', 50, 50);
          doc.fontSize(10).text(`Invoice #: ${invoiceData.orderId}`, 50, 80);
          doc.text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, 50, 95);
          doc.text(`Status: ${invoiceData.status}`, 50, 110);
          
          // Add seller information
          doc.fontSize(12).text('From:', 50, 150);
          doc.fontSize(10).text(invoiceData.sellerInfo.businessName, 50, 165);
          doc.text(invoiceData.sellerInfo.address, 50, 180);
          doc.text(`${invoiceData.sellerInfo.city}, ${invoiceData.sellerInfo.governorate}`, 50, 195);
          doc.text(`Phone: ${invoiceData.sellerInfo.phone}`, 50, 210);
          
          // Add customer information
          doc.fontSize(12).text('To:', 300, 150);
          doc.fontSize(10).text(invoiceData.customerName, 300, 165);
          doc.text(invoiceData.customerEmail, 300, 180);
          doc.text(invoiceData.customerPhone, 300, 195);
          doc.text(invoiceData.deliveryAddress, 300, 210, { width: 200 });
          
          // Add items table
          doc.fontSize(12).text('Items', 50, 280);
          
          // Table header
          doc.fontSize(10);
          doc.text('Item', 50, 300);
          doc.text('Quantity', 200, 300);
          doc.text('Price', 300, 300);
          doc.text('Total', 400, 300);
          
          // Table rows
          let y = 320;
          invoiceData.items.forEach(item => {
            doc.text(item.name, 50, y);
            doc.text(item.quantity.toString(), 200, y);
            doc.text(`$${item.price.toFixed(2)}`, 300, y);
            doc.text(`$${item.total.toFixed(2)}`, 400, y);
            y += 20;
          });
          
          // Add totals
          y += 20;
          doc.text('Total:', 300, y);
          doc.text(`$${invoiceData.total.toFixed(2)}`, 400, y);
          
          // Add footer
          doc.fontSize(10).text('Thank you for your business!', 50, 700);
          
          // Finalize the PDF
          doc.end();
        } catch (error) {
          console.error('Error in PDF generation:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate invoice PDF');
    }
  }
} 