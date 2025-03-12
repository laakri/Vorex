import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Governorate, WAREHOUSE_COVERAGE } from '@/config/constants';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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
            }
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

        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }

        return order;
      });

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
              governorate: true
            }
          },
          warehouse: {
            select: {
              name: true,
              city: true,
              governorate: true
            }
          },
          batch: {
            include: {
              driver: {
                select: {
                  id: true,
                  phone: true,
                  availabilityStatus: true,
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
                      plateNumber: true
                    }
                  }
                }
              },
              route: {
                select: {
                  status: true,
                  estimatedDuration: true,
                  startedAt: true,
                  completedAt: true,
                  totalDistance: true
                }
              }
            }
          },
          routeStops: {
            orderBy: {
              sequenceOrder: 'asc'
            },
            select: {
              address: true,
              latitude: true,
              longitude: true,
              isPickup: true,
              sequenceOrder: true,
              isCompleted: true,
              completedAt: true
            }
          },
          items: {
            select: {
              quantity: true,
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order with tracking ID ${trackingId} not found`);
      }

      // Format the tracking information with timeline
      const trackingTimeline = this.buildTrackingTimeline(order);
      
      // Get current location based on status
      const currentLocation = this.determineCurrentLocation(order);

      // Calculate estimated delivery time
      const estimatedDelivery = this.calculateEstimatedDelivery(order);

      return {
        orderId: order.id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customerInfo: {
          name: order.customerName,
          address: order.address,
          city: order.city,
          governorate: order.governorate
        },
        sellerInfo: {
          businessName: order.seller.businessName,
          city: order.seller.city,
          governorate: order.seller.governorate
        },
        currentLocation,
        estimatedDelivery,
        timeline: trackingTimeline,
        itemsSummary: this.formatOrderItems(order.items),
        batchInfo: order.batch ? {
          id: order.batch.id,
          status: order.batch.status,
          driver: order.batch.driver ? {
            name: order.batch.driver.user?.fullName,
            status: order.batch.driver.availabilityStatus,
            vehicle: order.batch.driver.vehicle ? {
              type: order.batch.driver.vehicle.type,
              model: order.batch.driver.vehicle.model,
              make: order.batch.driver.vehicle.make,
              plateNumber: order.batch.driver.vehicle.plateNumber
            } : null
          } : null,
          routeInfo: order.batch.route ? {
            status: order.batch.route.status,
            startedAt: order.batch.route.startedAt,
            estimatedDuration: order.batch.route.estimatedDuration,
            totalDistance: order.batch.route.totalDistance
          } : null
        } : null,
        warehouseInfo: order.warehouse ? {
          name: order.warehouse.name,
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
    // Explicitly type the timeline array
    const timeline: {status: string; timestamp: Date; description: string}[] = [];
    
    // Add order creation
    timeline.push({
      status: 'Order Created',
      timestamp: order.createdAt,
      description: `Order ${order.id} was created`
    });

    // Add status changes based on actual status
    switch (order.status) {
      case 'PENDING':
        timeline.push({
          status: 'Pending',
          timestamp: order.createdAt,
          description: 'Order is pending pickup'
        });
        break;
      
      case 'LOCAL_ASSIGNED_TO_PICKUP':
      case 'CITY_ASSIGNED_TO_PICKUP':
      case 'CITY_ASSIGNED_TO_PICKUP_ACCEPTED':
        timeline.push({
          status: 'Assigned for Pickup',
          timestamp: order.updatedAt,
          description: order.batch?.driver 
            ? `Order assigned to ${order.batch.driver.user?.fullName || 'driver'} for pickup` 
            : 'Order has been assigned for pickup'
        });
        break;
      
      case 'LOCAL_PICKED_UP':
      case 'CITY_PICKED_UP':
        timeline.push({
          status: 'Picked Up',
          timestamp: order.updatedAt,
          description: 'Order has been picked up from the seller'
        });
        break;
      
      case 'CITY_IN_TRANSIT_TO_WAREHOUSE':
        timeline.push({
          status: 'In Transit to Warehouse',
          timestamp: order.updatedAt,
          description: `Order is being transported to ${order.warehouse?.name || 'warehouse'}`
        });
        break;
      
      case 'CITY_ARRIVED_AT_SOURCE_WAREHOUSE':
        timeline.push({
          status: 'Arrived at Warehouse',
          timestamp: order.updatedAt,
          description: `Order has arrived at ${order.warehouse?.name || 'the source warehouse'}`
        });
        break;
      
      case 'CITY_READY_FOR_INTERCITY_TRANSFER':
      case 'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED':
        timeline.push({
          status: 'Ready for Transfer',
          timestamp: order.updatedAt,
          description: 'Order is ready to be transferred between cities'
        });
        break;
      
      case 'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE':
        timeline.push({
          status: 'In Transit',
          timestamp: order.updatedAt,
          description: 'Order is in transit to the destination warehouse'
        });
        break;
      
      case 'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE':
        timeline.push({
          status: 'Arrived at Destination',
          timestamp: order.updatedAt,
          description: 'Order has arrived at the destination warehouse'
        });
        break;
      
      case 'CITY_READY_FOR_LOCAL_DELIVERY':
      case 'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED':
        timeline.push({
          status: 'Ready for Delivery',
          timestamp: order.updatedAt,
          description: 'Order is ready for final delivery to customer'
        });
        break;
      
      case 'LOCAL_DELIVERED':
      case 'CITY_DELIVERED':
        timeline.push({
          status: 'Delivered',
          timestamp: order.updatedAt,
          description: 'Order has been delivered to the customer'
        });
        break;
      
      case 'CANCELLED':
        timeline.push({
          status: 'Cancelled',
          timestamp: order.updatedAt,
          description: 'Order has been cancelled'
        });
        break;
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
    // If the order is already delivered, return null (no estimation needed)
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
    
    // For pending orders, calculate a rough estimate
    const creationDate = new Date(order.createdAt);
    const estimatedDays = order.isLocalDelivery ? 1 : 3;
    
    const estimatedDate = new Date(creationDate);
    estimatedDate.setDate(creationDate.getDate() + estimatedDays);
    
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
    
    return updatedOrder;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    // Define valid status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'PENDING': ['LOCAL_ASSIGNED_TO_PICKUP', 'CITY_ASSIGNED_TO_PICKUP', 'CANCELLED'],
      'LOCAL_ASSIGNED_TO_PICKUP': ['LOCAL_PICKED_UP', 'CANCELLED'],
      'LOCAL_PICKED_UP': ['LOCAL_DELIVERED', 'CANCELLED'],
      'LOCAL_DELIVERED': [],
      'CITY_ASSIGNED_TO_PICKUP': ['CITY_ASSIGNED_TO_PICKUP_ACCEPTED', 'CITY_PICKED_UP', 'CANCELLED'],
      'CITY_ASSIGNED_TO_PICKUP_ACCEPTED': ['CITY_PICKED_UP', 'CANCELLED'],
      'CITY_PICKED_UP': ['CITY_IN_TRANSIT_TO_WAREHOUSE', 'CANCELLED'],
      'CITY_IN_TRANSIT_TO_WAREHOUSE': ['CITY_ARRIVED_AT_SOURCE_WAREHOUSE', 'CANCELLED'],
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
} 