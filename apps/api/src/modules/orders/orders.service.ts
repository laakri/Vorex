import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(sellerId: string, createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order with items in a transaction
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...orderData,
          sellerId,
          totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: items,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });
  }

  async findAll(sellerId: string) {
    return this.prisma.order.findMany({
      where: {
        sellerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
} 