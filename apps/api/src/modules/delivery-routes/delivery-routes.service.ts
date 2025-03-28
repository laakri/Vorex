import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { 
  Batch, 
  BatchStatus, 
  BatchType, 
  OrderStatus, 
  RouteStatus 
} from '@prisma/client';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';

@Injectable()
export class DeliveryRoutesService {
  private readonly logger = new Logger(DeliveryRoutesService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('*/30 * * * * *') // Every 30 seconds
  async processUnassignedBatches() {
    this.logger.log('Creating routes for unassigned batches...');

    const unassignedBatches = await this.prisma.batch.findMany({
      where: {
        status: BatchStatus.COLLECTING,
        routeId: null
      },
      include: {
        orders: true,
        warehouse: true
      }
    });

    this.logger.log(`Found ${unassignedBatches.length} unassigned batches`);

    for (const batch of unassignedBatches) {
      const existingRoute = await this.prisma.deliveryRoute.findUnique({
        where: { batchId: batch.id }
      });

      if (existingRoute) {
        this.logger.log(`Route already exists for batch ${batch.id}, skipping creation`);
        continue;
      }

      const route = await this.createRouteForBatch(batch);
      
      if (route) {
        // Update batch with routeId and mark as COMPLETED immediately
        await this.prisma.batch.update({
          where: { id: batch.id },
          data: { 
            routeId: route.id,
            status: BatchStatus.COMPLETED,
            completedTime: new Date()
          }
        });
        
        this.logger.log(`Batch ${batch.id} marked as COMPLETED after route creation`);
      }
    }
  }

  async getRouteById(id: string) {
    const route = await this.prisma.deliveryRoute.findUnique({
      where: { id },
      include: {
        batch: true,
        driver: true,
        stops: {
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      }
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async getRoutesByDriver(driverId: string) {
    return this.prisma.deliveryRoute.findMany({
      where: { driverId },
      include: {
        batch: true,
        stops: {
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async assignDriverToRoute(routeId: string, dto: AssignDriverDto) {
    const route = await this.prisma.deliveryRoute.findUnique({
      where: { id: routeId }
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${routeId} not found`);
    }

    // Check if driver exists and is available
    const driver = await this.prisma.driver.findUnique({
      where: { id: dto.driverId }
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${dto.driverId} not found`);
    }

    // Update the route with the driver
    const updatedRoute = await this.prisma.deliveryRoute.update({
      where: { id: routeId },
      data: {
        driverId: dto.driverId,
        status: RouteStatus.IN_PROGRESS,
        startedAt: new Date()
      },
      include: {
        batch: true,
        stops: true
      }
    });

    // Also update the batch with the driver
    await this.prisma.batch.update({
      where: { id: route.batchId },
      data: {
        driverId: dto.driverId,
        status: BatchStatus.PROCESSING
      }
    });

    return updatedRoute;
  }

  async updateRouteStatus(routeId: string, status: RouteStatus) {
    return this.prisma.deliveryRoute.update({
      where: { id: routeId },
      data: { status }
    });
  }

  async updateRouteStop(stopId: string, dto: UpdateRouteStopDto) {
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: stopId },
      include: {
        route: true,
        order: true
      }
    });

    if (!stop) {
      throw new NotFoundException(`Route stop with ID ${stopId} not found`);
    }

    const data: any = { ...dto };
    
    // If we're marking as completed and completedAt wasn't provided, set it
    if (dto.isCompleted && !dto.completedAt) {
      data.completedAt = new Date();
    }

    const updatedStop = await this.prisma.routeStop.update({
      where: { id: stopId },
      data,
      include: {
        route: {
          include: { 
            stops: true,
            batch: true
          }
        },
        order: true
      }
    });

    // If the stop is completed, update the order status accordingly
    if (updatedStop.isCompleted && updatedStop.orderId) {
      await this.updateOrderStatusBasedOnStop(updatedStop);
    }

    // Check if all stops in the route are completed
    if (this.areAllStopsCompleted(updatedStop.route)) {
      await this.markRouteAsCompleted(updatedStop.route.id);
    }

    return updatedStop;
  }

  private async createRouteForBatch(batch: any) {
    this.logger.log(`Creating route for batch ${batch.id} of type ${batch.type}`);
    
    try {
      // Check if a route already exists for this batch to avoid conflicts
      const existingRoute = await this.prisma.deliveryRoute.findFirst({
        where: { batchId: batch.id }
      });
      
      if (existingRoute) {
        this.logger.log(`Route already exists for batch ${batch.id}, skipping creation`);
        return existingRoute;
      }
      
      // Get warehouse info
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: batch.warehouseId }
      });

      if (!warehouse) {
        throw new Error(`Warehouse with ID ${batch.warehouseId} not found`);
      }

      // Interface for the stop data
      interface RouteStopData {
        orderId?: string;
        warehouseId?: string;
        address: string;
        latitude: number;
        longitude: number;
        isPickup: boolean;
        sequenceOrder: number;
      }

      // Initialize stops array
      const stops: RouteStopData[] = [];
      
      // Different logic based on batch type
      switch (batch.type) {
        case BatchType.LOCAL_PICKUP:
        case BatchType.LOCAL_SELLERS_WAREHOUSE:
          // For seller to warehouse deliveries
          // Add pickup points for all orders
          batch.orders.forEach((order, i) => {
            stops.push({
              orderId: order.id,
              address: order.address || 'Seller location',
              latitude: order.pickupLatitude,
              longitude: order.pickupLongitude,
              isPickup: true,
              sequenceOrder: i
            });
          });
          
          // Add warehouse as final destination
          stops.push({
            warehouseId: warehouse.id,
            address: warehouse.address,
            latitude: warehouse.latitude,
            longitude: warehouse.longitude,
            isPickup: false,
            sequenceOrder: batch.orders.length
          });
          break;
          
        case BatchType.LOCAL_WAREHOUSE_BUYERS:
          // Warehouse to buyer deliveries
          // Add warehouse as starting point
          stops.push({
            warehouseId: warehouse.id,
            address: warehouse.address,
            latitude: warehouse.latitude,
            longitude: warehouse.longitude,
            isPickup: true,
            sequenceOrder: 0
          });
          
          // Add all customer destinations
          batch.orders.forEach((order, i) => {
            stops.push({
              orderId: order.id,
              address: order.address || 'Customer location',
              latitude: order.dropLatitude,
              longitude: order.dropLongitude,
              isPickup: false,
              sequenceOrder: i + 1
            });
          });
          break;
          
        case BatchType.INTERCITY:
          // For warehouse to warehouse transfers
          let destinationWarehouseId: string | undefined = undefined;
          
          // First try to get from orders
          const orderWithSecondaryWarehouse = batch.orders.find(order => order.secondaryWarehouseId);
          if (orderWithSecondaryWarehouse) {
            destinationWarehouseId = orderWithSecondaryWarehouse.secondaryWarehouseId;
          } 
          
          // If no destination in orders, try to find another warehouse
          if (!destinationWarehouseId) {
            const otherWarehouses = await this.prisma.warehouse.findMany({
              where: {
                id: { not: warehouse.id }
              },
              take: 1
            });
            
            if (otherWarehouses.length > 0) {
              destinationWarehouseId = otherWarehouses[0].id;
              this.logger.log(`No destination warehouse found in orders. Using default warehouse: ${destinationWarehouseId}`);
            } else {
              throw new Error('No secondary warehouse found for intercity batch');
            }
          }
          
          // Get the destination warehouse details
          const destinationWarehouse = await this.prisma.warehouse.findUnique({
            where: { id: destinationWarehouseId }
          });
          
          if (!destinationWarehouse) {
            throw new Error(`Destination warehouse with ID ${destinationWarehouseId} not found`);
          }
          
          // Add source warehouse
          stops.push({
            warehouseId: warehouse.id,
            address: warehouse.address,
            latitude: warehouse.latitude,
            longitude: warehouse.longitude,
            isPickup: true,
            sequenceOrder: 0
          });
          
          // Add destination warehouse
          stops.push({
            warehouseId: destinationWarehouse.id,
            address: destinationWarehouse.address,
            latitude: destinationWarehouse.latitude,
            longitude: destinationWarehouse.longitude,
            isPickup: false,
            sequenceOrder: 1
          });
          break;
          
        default:
          throw new Error(`Unsupported batch type: ${batch.type}`);
      }
      
      // Calculate route metrics
      const totalDistance = this.calculateTotalDistance(stops);
      const estimatedDuration = this.estimateDuration(stops.length, batch.type);
      
      // Create route with stops
      const routeData: any = {
        batchId: batch.id,
        totalDistance,
        estimatedDuration,
        fromWarehouseId: batch.warehouseId,
        stops: {
          create: stops
        }
      };
      
      // For intercity, add destination warehouse
      if (batch.type === BatchType.INTERCITY) {
        // Find destination warehouse ID from the last stop
        const destinationStop = stops.find(stop => !stop.isPickup);
        if (destinationStop && destinationStop.warehouseId) {
          routeData.toWarehouseId = destinationStop.warehouseId;
        }
      }
      
      return await this.prisma.deliveryRoute.create({
        data: routeData,
        include: {
          stops: true
        }
      });
    } catch (error) {
      this.logger.error(`Error creating route for batch ${batch.id}: ${error.message}`);
      // Return null instead of throwing, so the cron job can continue
      return null;
    }
  }

  private calculateTotalDistance(stops: any[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += this.calculateDistance(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude
      );
    }
    
    return parseFloat(totalDistance.toFixed(2));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private estimateDuration(numberOfStops: number, batchType: BatchType): number {
    // Basic estimation:
    // - 10 minutes per stop for loading/unloading
    // - Different average speeds based on batch type
    const stopTime = numberOfStops * 10; // 10 minutes per stop
    
    // Add travel time based on batch type
    switch (batchType) {
      case BatchType.INTERCITY:
        // Longer distances, higher speed, fewer stops
        return stopTime + 120; // Add 2 hours for intercity travel
      default:
        // Local deliveries
        return stopTime + (numberOfStops * 15); // 15 min between stops on average
    }
  }

  private async updateOrderStatusBasedOnStop(stop: any) {
    if (!stop.orderId) return;
    
    const order = await this.prisma.order.findUnique({
      where: { id: stop.orderId },
      include: { batch: true }
    });
    
    if (!order) return;
    
    let newStatus: OrderStatus;
    
    // Determine new status based on batch type and whether this is a pickup or delivery
    switch (order.batch?.type) {
      case BatchType.LOCAL_PICKUP:
      case BatchType.LOCAL_SELLERS_WAREHOUSE:
        newStatus = stop.isPickup 
          ? OrderStatus.CITY_PICKED_UP 
          : OrderStatus.CITY_ARRIVED_AT_SOURCE_WAREHOUSE;
        break;
        
      case BatchType.LOCAL_WAREHOUSE_BUYERS:
        newStatus = stop.isPickup 
          ? OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY_BATCHED 
          : OrderStatus.CITY_DELIVERED;
        break;
        
      case BatchType.INTERCITY:
        if (stop.isPickup) {
          newStatus = OrderStatus.CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE;
        } else {
          newStatus = OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE;
          // When an order arrives at the destination warehouse, it should be ready for local delivery
          setTimeout(async () => {
            await this.prisma.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY }
            });
          }, 5000); // Small delay to allow the transaction to complete
        }
        break;
        
      default:
        return; // Don't update if we don't have a matching case
    }
    
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus }
    });
  }

  private areAllStopsCompleted(route: any): boolean {
    return route.stops.every(stop => stop.isCompleted);
  }

  private async markRouteAsCompleted(routeId: string) {
    await this.prisma.deliveryRoute.update({
      where: { id: routeId },
      data: {
        status: RouteStatus.COMPLETED,
        completedAt: new Date()
      }
    });
    
    // Also mark the associated batch as completed
    const route = await this.prisma.deliveryRoute.findUnique({
      where: { id: routeId }
    });
    
    if (route?.batchId) {
      await this.prisma.batch.update({
        where: { id: route.batchId },
        data: {
          status: BatchStatus.COMPLETED,
          completedTime: new Date()
        }
      });
    }
  }

  async getRoutesByWarehouse(warehouseId: string) {
    return this.prisma.deliveryRoute.findMany({
      where: {
        OR: [
          { fromWarehouseId: warehouseId },
          { toWarehouseId: warehouseId }
        ]
      },
      include: {
        batch: true,
        driver: true,
        stops: {
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Add this new method to get available routes
  async getAvailableRoutes() {
    return this.prisma.deliveryRoute.findMany({
      where: {
        status: RouteStatus.PENDING,
        driverId: null // Only routes not assigned to a driver
      },
      include: {
        batch: true,
        fromWarehouse: true,
        toWarehouse: true,
        stops: {
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getDriverActiveRoute(driverId: string) {
    // Get the active route for this driver
    const activeRoute = await this.prisma.deliveryRoute.findFirst({
      where: {
        driverId,
        status: RouteStatus.IN_PROGRESS,
      },
      include: {
        batch: true,
        fromWarehouse: true,
        toWarehouse: true,
        stops: {
          orderBy: {
            sequenceOrder: 'asc',
          },
          include: {
            order: {
              select: {
                id: true,
                status: true,
                customerName: true,
                phone: true,
                totalAmount: true,
                notes: true,
              }
            },
            warehouse: true,
          }
        },
        driver: true
      },
    });
    
    return activeRoute;
  }

  async updateRouteStopCompletion(stopId: string, data: { isCompleted: boolean, notes?: string }) {
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: stopId },
      include: { route: true }
    });
    
    if (!stop) {
      throw new NotFoundException('Route stop not found');
    }
    
    // Update the stop
    const updatedStop = await this.prisma.routeStop.update({
      where: { id: stopId },
      data: {
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date() : null,
        notes: data.notes,
      },
      include: {
        order: true,
        route: true
      }
    });
    
    // Check if all stops are completed
    if (data.isCompleted) {
      const allStops = await this.prisma.routeStop.findMany({
        where: { routeId: stop.routeId }
      });
      
      const allCompleted = allStops.every(s => s.isCompleted);
      
      // If all stops are completed, mark the route as completed
      if (allCompleted) {
        await this.prisma.deliveryRoute.update({
          where: { id: stop.routeId },
          data: {
            status: RouteStatus.COMPLETED,
            completedAt: new Date()
          }
        });
        
        // Also update the batch if there is one
        if (stop.route.batchId) {
          await this.prisma.batch.update({
            where: { id: stop.route.batchId },
            data: {
              status: BatchStatus.COMPLETED,
              completedTime: new Date()
            }
          });
        }
      }
    }
    
    return updatedStop;
  }
} 