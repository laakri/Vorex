import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SellerApiService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private usersService: UsersService,
  ) {}

  async generateApiKey(userId: string): Promise<{ apiKey: string }> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new UnauthorizedException('User is not a seller');
    }

    // Generate a secure random API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Store the hashed API key
    const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    await this.prisma.seller.update({
      where: { id: seller.id },
      data: { apiKey: hashedApiKey },
    });

    return { apiKey };
  }

  async validateApiKey(apiKey: string): Promise<string> {
    const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const seller = await this.prisma.seller.findFirst({
      where: { apiKey: hashedApiKey },
      select: { id: true, userId: true },
    });

    if (!seller) {
      throw new UnauthorizedException('Invalid API key');
    }

    return seller.userId;
  }

  async createOrder(apiKey: string, createOrderDto: CreateOrderDto) {
    const userId = await this.validateApiKey(apiKey);
    return this.ordersService.create(userId, createOrderDto);
  }

  async getOrder(apiKey: string, orderId: string) {
    const userId = await this.validateApiKey(apiKey);
    return this.ordersService.findOne(userId, orderId);
  }

  async listOrders(apiKey: string, status?: OrderStatus) {
    const userId = await this.validateApiKey(apiKey);
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return this.ordersService.findAll(seller.id);
  }

  async getOrderStatus(apiKey: string, orderId: string) {
    const userId = await this.validateApiKey(apiKey);
    const order = await this.ordersService.findOne(userId, orderId);
    return { status: order.status };
  }

  async revokeApiKey(apiKey: string) {
    const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    await this.prisma.seller.updateMany({
      where: { apiKey: hashedApiKey },
      data: { apiKey: null },
    });
  }
} 