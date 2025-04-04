import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateWarehouseSectionDto } from './dto/create-warehouse-section.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { AssignOrderLocationDto } from './dto/assign-order-location.dto';
import { CreatePileDto } from './dto/create-pile.dto';
import { format } from 'date-fns';
import { UpdateWarehouseSettingsDto } from './dto/update-warehouse-settings.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async getWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        managers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        sections: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        managers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        sections: {
          include: {
            piles: true
          }
        }
      }
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async createWarehouse(createWarehouseDto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: createWarehouseDto.name,
        address: createWarehouseDto.address,
        city: createWarehouseDto.city,
        governorate: createWarehouseDto.governorate,
        postalCode: createWarehouseDto.postalCode,
        phone: createWarehouseDto.phone,
        capacity: createWarehouseDto.capacity,
        currentLoad: 0,
        latitude: createWarehouseDto.latitude,
        longitude: createWarehouseDto.longitude,
        coverageGovernorate: createWarehouseDto.coverageGovernorate
      }
    });
  }

  async updateWarehouse(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    // Verify warehouse exists
    await this.getWarehouseById(id);

    return this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto
    });
  }

  async getWarehouseSections(warehouseId: string) {
    // Verify warehouse exists
    await this.getWarehouseById(warehouseId);

    return this.prisma.warehouseSection.findMany({
      where: { warehouseId },
      include: {
        piles: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async createWarehouseSection(warehouseId: string, createSectionDto: CreateWarehouseSectionDto) {
    // Verify warehouse exists
    const warehouse = await this.getWarehouseById(warehouseId);

    // Validate that the warehouse has enough remaining capacity
    const totalSectionCapacity = await this.getTotalSectionCapacity(warehouseId);
    const remainingWarehouseCapacity = warehouse.capacity - totalSectionCapacity;

    if (createSectionDto.capacity > remainingWarehouseCapacity) {
      throw new BadRequestException(
        `Section capacity (${createSectionDto.capacity}) exceeds remaining warehouse capacity (${remainingWarehouseCapacity})`
      );
    }

    // Create new section
    return this.prisma.warehouseSection.create({
      data: {
        warehouseId,
        name: createSectionDto.name,
        description: createSectionDto.description,
        capacity: createSectionDto.capacity,
        currentLoad: 0,
        sectionType: createSectionDto.sectionType
      }
    });
  }

  async createPile(sectionId: string, createPileDto: CreatePileDto) {
    // Verify section exists
    const section = await this.prisma.warehouseSection.findUnique({
      where: { id: sectionId },
      include: {
        piles: true
      }
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    // Calculate total capacity of existing piles
    const totalPileCapacity = section.piles.reduce((sum, pile) => sum + pile.capacity, 0);
    
    // Calculate remaining section capacity
    const remainingSectionCapacity = section.capacity - totalPileCapacity;

    // Validate that the section has enough remaining capacity
    if (createPileDto.capacity > remainingSectionCapacity) {
      throw new BadRequestException(
        `Pile capacity (${createPileDto.capacity}) exceeds remaining section capacity (${remainingSectionCapacity})`
      );
    }

    // Create new pile
    return this.prisma.pile.create({
      data: {
        sectionId,
        name: createPileDto.name,
        description: createPileDto.description,
        capacity: createPileDto.capacity,
        currentLoad: 0,
        pileType: createPileDto.pileType
      }
    });
  }

  async getIncomingWarehouseOrders(warehouseId: string, status?: string) {
    // Verify warehouse exists
    await this.getWarehouseById(warehouseId);

    // Build the query for both source and destination warehouse orders
    const whereClause: Prisma.OrderWhereInput = {
      OR: [
        // Orders coming to this warehouse as source warehouse
        {
          warehouseId,
          status: {
            in: [
              OrderStatus.CITY_PICKED_UP,
              OrderStatus.CITY_ARRIVED_AT_SOURCE_WAREHOUSE
            ]
          }
        },
        // Orders coming to this warehouse as destination warehouse
        {
          secondaryWarehouseId: warehouseId,
          status: {
            in: [
              OrderStatus.CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE,
              OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE
            ]
          }
        }
      ]
    };

    // Add specific status filter if provided
    if (status) {
      whereClause.status = status as OrderStatus;
    }

    return this.prisma.order.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            businessName: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        batch: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async getOutgoingWarehouseOrders(warehouseId: string, status?: string) {
    // Verify warehouse exists
    await this.getWarehouseById(warehouseId);

    // Build the query for orders that should be delivered from this warehouse
    const whereClause: Prisma.OrderWhereInput = {
      secondaryWarehouseId: warehouseId,
      // Orders that are ready to be sent out from this warehouse
      OR: [
        { status: OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE },
        { status: OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY },
        { status: OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY_BATCHED }
      ]
    };

    // Add status filter if provided
    if (status) {
      whereClause.status = status as OrderStatus;
    }

    return this.prisma.order.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            businessName: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        },
        batch: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async assignOrderLocation(
    orderId: string, 
    assignLocationDto: AssignOrderLocationDto,
    userId: string
  ) {
    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get the relevant warehouse ID, ensuring it's not null
    const relevantWarehouseId = order.warehouseId || order.secondaryWarehouseId;
    
    if (!relevantWarehouseId) {
      throw new BadRequestException('Order is not associated with any warehouse');
    }

    // Verify the manager has access to this warehouse
    const manager = await this.prisma.warehouseManager.findFirst({
      where: {
        userId,
        warehouseId: relevantWarehouseId
      }
    });

    if (!manager) {
      throw new ForbiddenException('You do not have access to manage this warehouse');
    }

    // Verify the section exists
    const section = await this.prisma.warehouseSection.findUnique({
      where: { id: assignLocationDto.sectionId }
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${assignLocationDto.sectionId} not found`);
    }

    // Verify the pile exists
    const pile = await this.prisma.pile.findUnique({
      where: { id: assignLocationDto.pileId }
    });

    if (!pile) {
      throw new NotFoundException(`Pile with ID ${assignLocationDto.pileId} not found`);
    }

    // Calculate the order's weight and volume to update warehouse capacity
    const orderWeight = order.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const orderVolume = order.items.reduce((sum, item) => {
      // Parse dimensions string (assuming format: "LxWxH")
      const dimensions = item.dimensions.split('x').map(Number);
      if (dimensions.length === 3) {
        return sum + (dimensions[0] * dimensions[1] * dimensions[2] * item.quantity);
      }
      return sum;
    }, 0);

    // Check if pile has enough capacity
    if (pile.currentLoad + orderWeight > pile.capacity) {
      throw new BadRequestException(
        `Pile ${pile.name} does not have enough capacity for this order. ` +
        `Current load: ${pile.currentLoad}, Order weight: ${orderWeight}, Capacity: ${pile.capacity}`
      );
    }

    // Check if section has enough capacity
    if (section.currentLoad + orderWeight > section.capacity) {
      throw new BadRequestException(
        `Section ${section.name} does not have enough capacity for this order. ` +
        `Current load: ${section.currentLoad}, Order weight: ${orderWeight}, Capacity: ${section.capacity}`
      );
    }

    // Begin transaction to update order and warehouse section/pile
    return this.prisma.$transaction(async (prisma) => {
      // Update the warehouse section load
      await prisma.warehouseSection.update({
        where: { id: section.id },
        data: {
          currentLoad: {
            increment: orderWeight
          }
        }
      });

      // Update the pile load
      await prisma.pile.update({
        where: { id: pile.id },
        data: {
          currentLoad: {
            increment: orderWeight
          }
        }
      });

      // Update the warehouse load
      await prisma.warehouse.update({
        where: { id: relevantWarehouseId },
        data: {
          currentLoad: {
            increment: orderWeight
          }
        }
      });

      // Create audit record
      await prisma.inventoryAudit.create({
        data: {
          managerId: manager.id,
          warehouseId: relevantWarehouseId,
          date: new Date(),
          findings: `Order ${orderId} placed in section ${section.name}, pile ${pile.name}`,
          action: 'ORDER_PLACEMENT'
        }
      });

      // Update order status based on its current state
      let newStatus: OrderStatus;
      
      if (order.status === OrderStatus.CITY_ARRIVED_AT_SOURCE_WAREHOUSE) {
        newStatus = OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER;
      } else if (order.status === OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE) {
        newStatus = OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY;
      } else {
        // Keep current status if it doesn't match any expected transitions
        newStatus = order.status;
      }

      // Update the order with new status
      return prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus
        }
      });
    });
  }

  async updateOrderStatus(orderId: string, status: string, userId: string) {
    // Validate status is a valid OrderStatus
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get the relevant warehouse ID, ensuring it's not null
    const relevantWarehouseId = order.warehouseId || order.secondaryWarehouseId;
    
    if (!relevantWarehouseId) {
      throw new BadRequestException('Order is not associated with any warehouse');
    }

    // Verify the manager has access to this warehouse
    const manager = await this.prisma.warehouseManager.findFirst({
      where: {
        userId,
        warehouseId: relevantWarehouseId
      }
    });

    if (!manager) {
      throw new ForbiddenException('You do not have access to manage this warehouse');
    }

    // Validate order status transitions
    this.validateStatusTransition(order.status as OrderStatus, status as OrderStatus);

    // If transitioning to a delivered or cancelled status, update inventory
    if (status === OrderStatus.CITY_DELIVERED || status === OrderStatus.CANCELLED) {
      return this.handleOrderCompletion(order, status as OrderStatus, manager.id);
    }

    // Update order status
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus
      }
    });
  }

  async getWarehouseRoutes(warehouseId: string) {
    // Verify warehouse exists
    await this.getWarehouseById(warehouseId);

    return this.prisma.deliveryRoute.findMany({
      where: {
        OR: [
          { fromWarehouseId: warehouseId },
          { toWarehouseId: warehouseId }
        ]
      },
      include: {
        batch: true,
        driver: {
          include: {
            user: {
              select: {
                fullName: true
              }
            },
            vehicle: true
          }
        },
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

  async getWarehouseInventory(warehouseId: string) {
    // Verify warehouse exists
    const warehouse = await this.getWarehouseById(warehouseId);

    const sections = await this.prisma.warehouseSection.findMany({
      where: { warehouseId },
      include: {
        piles: true
      }
    });

    // Get open orders in this warehouse
    const openOrders = await this.prisma.order.count({
      where: {
        OR: [
          { warehouseId, status: { not: OrderStatus.CITY_DELIVERED } },
          { secondaryWarehouseId: warehouseId, status: { not: OrderStatus.CITY_DELIVERED } }
        ]
      }
    });

    // Calculate the utilization percentage
    const capacityUtilization = warehouse.capacity > 0 
      ? (warehouse.currentLoad / warehouse.capacity) * 100
      : 0;

    // Calculate average processing time for orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedOrders = await this.prisma.order.findMany({
      where: {
        OR: [
          { warehouseId },
          { secondaryWarehouseId: warehouseId }
        ],
        status: OrderStatus.CITY_DELIVERED,
        updatedAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    let avgProcessingTime = 0;
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((sum, order) => {
        return sum + (order.updatedAt.getTime() - order.createdAt.getTime());
      }, 0);
      avgProcessingTime = totalTime / completedOrders.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      warehouseId,
      name: warehouse.name,
      totalCapacity: warehouse.capacity,
      currentLoad: warehouse.currentLoad,
      capacityUtilization,
      openOrders,
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        type: section.sectionType,
        capacity: section.capacity,
        currentLoad: section.currentLoad,
        utilization: section.capacity > 0 ? (section.currentLoad / section.capacity) * 100 : 0,
        piles: section.piles.map(pile => ({
          id: pile.id,
          name: pile.name,
          type: pile.pileType,
          capacity: pile.capacity,
          currentLoad: pile.currentLoad,
          utilization: pile.capacity > 0 ? (pile.currentLoad / pile.capacity) * 100 : 0
        }))
      })),
      performance: {
        avgProcessingTimeHours: avgProcessingTime,
        completedOrdersLast30Days: completedOrders.length
      }
    };
  }

  // Helper method to validate status transitions
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    // Define allowed transitions - use a partial record instead of a complete one
    const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      // Source warehouse flows
      [OrderStatus.PENDING]: [
        OrderStatus.CITY_ASSIGNED_TO_PICKUP,
        OrderStatus.LOCAL_ASSIGNED_TO_PICKUP,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_ASSIGNED_TO_PICKUP]: [
        OrderStatus.CITY_PICKED_UP,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_PICKED_UP]: [
        OrderStatus.CITY_ARRIVED_AT_SOURCE_WAREHOUSE,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_ARRIVED_AT_SOURCE_WAREHOUSE]: [
        OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER]: [
        OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED]: [
        OrderStatus.CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE]: [
        OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE,
        OrderStatus.CANCELLED
      ],
      
      // Destination warehouse flows
      [OrderStatus.CITY_ARRIVED_AT_DESTINATION_WAREHOUSE]: [
        OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY]: [
        OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY_BATCHED,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY_BATCHED]: [
        OrderStatus.CITY_DELIVERED,
        OrderStatus.CANCELLED
      ],
      
      // Local delivery flows
      [OrderStatus.LOCAL_ASSIGNED_TO_PICKUP]: [
        OrderStatus.LOCAL_PICKED_UP,
        OrderStatus.CANCELLED
      ],
      [OrderStatus.LOCAL_PICKED_UP]: [
        OrderStatus.LOCAL_DELIVERED,
        OrderStatus.CANCELLED
      ],
      
      // Terminal states
      [OrderStatus.LOCAL_DELIVERED]: [OrderStatus.CANCELLED],
      [OrderStatus.CITY_DELIVERED]: [OrderStatus.CANCELLED],
      [OrderStatus.CANCELLED]: []
    };

    // Special case: CANCELLED can be set from almost any status
    if (newStatus === OrderStatus.CANCELLED) {
      return; // Allow cancellation from any state
    }
    
    if (currentStatus === newStatus) {
      return; // No actual change
    }

    const allowed = allowedTransitions[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  // Helper method to handle order completion (delivered or cancelled)
  private async handleOrderCompletion(order: any, newStatus: OrderStatus, managerId: string) {
    // Calculate the order's weight
    const orderWeight = order.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    // Begin transaction to update order status and adjust inventory
    return this.prisma.$transaction(async (prisma) => {
      // Find the pile and section where this order is stored
      // This would require additional tracking of where orders are stored
      // For now, we'll just update the warehouse capacity
      
      // Update the warehouse load (decrease)
      const relevantWarehouseId = order.warehouseId || order.secondaryWarehouseId;
      
      await prisma.warehouse.update({
        where: { id: relevantWarehouseId },
        data: {
          currentLoad: {
            decrement: orderWeight
          }
        }
      });

      // Create audit record
      await prisma.inventoryAudit.create({
        data: {
          managerId,
          warehouseId: relevantWarehouseId,
          date: new Date(),
          findings: `Order ${order.id} ${newStatus === OrderStatus.CITY_DELIVERED ? 'delivered' : 'cancelled'}`,
          action: newStatus === OrderStatus.CITY_DELIVERED ? 'ORDER_DELIVERY' : 'ORDER_CANCELLATION'
        }
      });

      // Update order status
      return prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus
        }
      });
    });
  }

  // Helper method to get total capacity of all sections in a warehouse
  private async getTotalSectionCapacity(warehouseId: string): Promise<number> {
    const sections = await this.prisma.warehouseSection.findMany({
      where: { warehouseId },
      select: { capacity: true }
    });
    
    return sections.reduce((sum, section) => sum + section.capacity, 0);
  }

  async getWarehouseDashboardData(warehouseId: string) {
    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        managers: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        sections: {
          include: {
            piles: true
          }
        }
      }
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Calculate capacity utilization
    const capacityUtilization = warehouse.capacity > 0 
      ? (warehouse.currentLoad / warehouse.capacity) * 100
      : 0;
    
    // Get warehouse sections with piles
    const sections = await this.prisma.warehouseSection.findMany({
      where: { warehouseId },
      include: {
        piles: true
      }
    });
    
    // Get incoming orders (orders where this warehouse is the secondary warehouse)
    const incomingOrders = await this.prisma.order.count({
      where: {
        secondaryWarehouseId: warehouseId,
        status: {
          in: [
            OrderStatus.CITY_PICKED_UP,
            OrderStatus.CITY_ARRIVED_AT_SOURCE_WAREHOUSE
          ]
        }
      }
    });
    
    // Get outgoing orders (orders where this warehouse is the primary warehouse)
    const outgoingOrders = await this.prisma.order.count({
      where: {
        warehouseId: warehouseId,
        status: {
          in: [
            OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER,
            OrderStatus.CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED,
            OrderStatus.CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE
          ]
        }
      }
    });
    
    // Get orders ready for local delivery
    const readyForDelivery = await this.prisma.order.count({
      where: {
        secondaryWarehouseId: warehouseId,
        status: {
          in: [
            OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY,
            OrderStatus.CITY_READY_FOR_LOCAL_DELIVERY_BATCHED
          ]
        }
      }
    });
    
    // Get recent orders instead of audits
    const recentOrders = await this.prisma.order.findMany({
      where: { 
        OR: [
          { warehouseId },
          { secondaryWarehouseId: warehouseId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        seller: {
          select: {
            businessName: true
          }
        }
      }
    });
    
    // Get active batches
    const activeBatches = await this.prisma.batch.findMany({
      where: { 
        warehouseId,
        status: {
          in: ['COLLECTING', 'PROCESSING']
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });
    
    // Get warehouse managers
    const managers = await this.prisma.warehouseManager.findMany({
      where: {
        warehouseId
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });
    
    // Get daily order data for the past week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const rawDailyOrders = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(CASE WHEN "secondaryWarehouseId" = ${warehouseId} THEN 1 END) as incoming,
        COUNT(CASE WHEN "warehouseId" = ${warehouseId} THEN 1 END) as outgoing
      FROM "Order"
      WHERE 
        ("warehouseId" = ${warehouseId} OR "secondaryWarehouseId" = ${warehouseId})
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;
    
    // Helper function to format dates without date-fns
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    };
    
    const formatDateTime = (date: Date): string => {
      return date.toISOString().replace('T', ' ').substring(0, 16); // Returns YYYY-MM-DD HH:MM
    };
    
    // Convert BigInt values to regular numbers
    const dailyOrders = (rawDailyOrders as any[]).map(row => ({
      date: row.date ? formatDate(new Date(row.date)) : '',
      incoming: row.incoming ? Number(row.incoming) : 0,
      outgoing: row.outgoing ? Number(row.outgoing) : 0
    }));
    
    return {
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        address: warehouse.address,
        city: warehouse.city,
        governorate: warehouse.governorate,
        capacity: warehouse.capacity,
        currentLoad: warehouse.currentLoad,
        capacityUtilization
      },
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        type: section.sectionType,
        capacity: section.capacity,
        currentLoad: section.currentLoad,
        utilization: section.capacity > 0 ? (section.currentLoad / section.capacity) * 100 : 0,
        pileCount: section.piles.length
      })),
      orderStats: {
        incomingOrders,
        outgoingOrders,
        readyForDelivery
      },
      recentActivity: recentOrders.map(order => ({
        id: order.id,
        date: formatDate(order.createdAt),
        type: 'Order',
        status: order.status,
        description: `Order from ${order.seller?.businessName || 'Unknown seller'}`
      })),
      activeBatches: activeBatches.map(batch => ({
        id: batch.id,
        type: batch.type,
        status: batch.status,
        orderCount: batch.orderCount,
        driverName: batch.driver?.user?.fullName || 'Unassigned',
        scheduledTime: batch.scheduledTime ? formatDateTime(batch.scheduledTime) : null
      })),
      managers: managers.map(manager => ({
        id: manager.id,
        name: manager.user.fullName,
        email: manager.user.email,
        employeeId: manager.employeeId,
        securityClearance: manager.securityClearance,
        shiftPreference: manager.shiftPreference
      })),
      dailyOrders
    };
  }

  async getWarehouseSettings(warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    return warehouse;
  }

  async updateWarehouseSettings(warehouseId: string, updateSettingsDto: UpdateWarehouseSettingsDto) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    return this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        name: updateSettingsDto.name,
        address: updateSettingsDto.address,
        city: updateSettingsDto.city,
        governorate: updateSettingsDto.governorate,
        postalCode: updateSettingsDto.postalCode,
        phone: updateSettingsDto.phone,
        capacity: updateSettingsDto.capacity,
        currentLoad: updateSettingsDto.currentLoad,
        latitude: updateSettingsDto.latitude,
        longitude: updateSettingsDto.longitude,
        coverageGovernorate: updateSettingsDto.coverageGovernorate
      }
    });
  }
}