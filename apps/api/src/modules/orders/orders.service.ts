import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@/common/enums/order-status.enum';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    console.log('Creating order for user:', userId);

    // First check if user exists and is a seller
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        seller: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.seller) {
      throw new BadRequestException(
        'Seller profile not found. Please complete your seller profile first.'
      );
    }

    if (!user.seller.isVerified) {
      throw new BadRequestException(
        'Your seller account is not verified yet. Please wait for verification.'
      );
    }

    try {
      console.log('Found seller:', user.seller.id);
      
      // Create the order with items in a transaction
      const order = await this.prisma.$transaction(async (tx) => {
        // Verify products exist and belong to seller
        for (const item of dto.items) {
          const product = await tx.product.findFirst({
            where: {
              id: item.productId,
              sellerId: user.seller!.id
            }
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found or doesn't belong to seller`
            );
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}`
            );
          }
        }

        // 1. Create the main order
        const newOrder = await tx.order.create({
          data: {
            sellerId: user.seller!.id,
            status: 'PENDING',
            totalAmount: dto.totalAmount,
            address: dto.address,
            city: dto.city,
            governorate: dto.governorate,
            postalCode: dto.postalCode,
            phone: dto.phone,
            customerName: dto.customerName,
            customerEmail: dto.customerEmail,
            notes: dto.notes,
            items: {
              create: dto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                weight: item.weight,
                dimensions: item.dimensions,
                packagingType: item.packagingType,
                fragile: item.fragile,
                perishable: item.perishable,
              }))
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        // 2. Update product stock
        for (const item of dto.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }

        console.log('Order created successfully:', newOrder.id);
        return newOrder;
      });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
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
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Found ${orders.length} orders`);
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