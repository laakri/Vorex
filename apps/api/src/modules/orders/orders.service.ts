import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@/common/enums/order-status.enum';
import { Prisma } from '@prisma/client';
import { WAREHOUSE_COVERAGE, Governorate } from '@/config/constants';

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

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      const seller = await this.prisma.seller.findUnique({
        where: { userId },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          governorate: true
        }
      });

      if (!seller) {
        throw new NotFoundException('Seller not found');
      }

      const isLocal = this.isLocalDelivery(
        seller.governorate,
        createOrderDto.governorate
      );

      // Create the order with items in a transaction
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

        // Update product stock
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

  async updateStatus(sellerId: string, id: string, status: OrderStatus) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        sellerId,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
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
} 