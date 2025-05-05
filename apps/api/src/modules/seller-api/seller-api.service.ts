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

  async getApiKey(userId: string): Promise<string | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { 
        id: true,
        apiKey: true
      },
    });

    if (!seller) {
      throw new UnauthorizedException('User is not a seller');
    }

    return seller.apiKey; // Returns null if no API key exists
  }

  async getApiStats(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new UnauthorizedException('User is not a seller');
    }

    // Get total requests count
    const totalRequests = await this.prisma.apiLog.count({
      where: { sellerId: seller.id }
    });

    // Get error count
    const totalErrors = await this.prisma.apiLog.count({
      where: { 
        sellerId: seller.id,
        status: {
          gte: 400
        }
      }
    });

    // Get last used timestamp
    const lastLog = await this.prisma.apiLog.findFirst({
      where: { sellerId: seller.id },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });

    return {
      totalRequests,
      totalErrors,
      lastUsed: lastLog?.timestamp || null
    };
  }

  async getApiHistory(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new UnauthorizedException('User is not a seller');
    }

    // Get the 50 most recent API logs
    const logs = await this.prisma.apiLog.findMany({
      where: { sellerId: seller.id },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return logs;
  }

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
      data: { 
        apiKey: hashedApiKey 
      },
    });

    // Log the API key generation
    await this.logApiCall(seller.id, 'GENERATE_KEY', 200, 0);

    return { apiKey };
  }

  async validateApiKey(apiKey: string): Promise<string> {
    const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const seller = await this.prisma.seller.findFirst({
      where: { 
        apiKey: hashedApiKey 
      },
      select: { id: true, userId: true },
    });

    if (!seller) {
      throw new UnauthorizedException('Invalid API key');
    }

    return seller.userId;
  }

  async revokeApiKey(userId: string): Promise<void> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new UnauthorizedException('User is not a seller');
    }
    
    await this.prisma.seller.update({
      where: { id: seller.id },
      data: { apiKey: null },
    });

    // Log the API key revocation
    await this.logApiCall(seller.id, 'REVOKE_KEY', 200, 0);
  }

  async createOrder(
    apiKey: string, 
    createOrderDto: CreateOrderDto,
    clientIp?: string,
    userAgent?: string
  ) {
    const userId = await this.validateApiKey(apiKey);
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Start measuring response time
    const startTime = Date.now();
    
    try {
      const result = await this.ordersService.create(userId, createOrderDto);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      await this.logApiCall(
        seller.id, 
        'CREATE_ORDER', 
        200, 
        responseTime,
        createOrderDto,
        result,
        clientIp,
        userAgent
      );
      
      return result;
    } catch (error) {
      // Log failed API call
      const responseTime = Date.now() - startTime;
      const status = error.status || 500;
      await this.logApiCall(
        seller.id, 
        'CREATE_ORDER', 
        status, 
        responseTime,
        createOrderDto,
        { error: error.message },
        clientIp,
        userAgent
      );
      
      throw error;
    }
  }

  async getOrder(
    apiKey: string, 
    orderId: string,
    clientIp?: string,
    userAgent?: string
  ) {
    const userId = await this.validateApiKey(apiKey);
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });
    
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    
    // Start measuring response time
    const startTime = Date.now();
    
    try {
      const result = await this.ordersService.findOne(userId, orderId);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      await this.logApiCall(
        seller.id, 
        'GET_ORDER', 
        200, 
        responseTime,
        { orderId },
        result,
        clientIp,
        userAgent
      );
      
      return result;
    } catch (error) {
      // Log failed API call
      const responseTime = Date.now() - startTime;
      const status = error.status || 500;
      await this.logApiCall(
        seller.id, 
        'GET_ORDER', 
        status, 
        responseTime,
        { orderId },
        { error: error.message },
        clientIp,
        userAgent
      );
      
      throw error;
    }
  }

  async listOrders(
    apiKey: string, 
    status?: OrderStatus,
    clientIp?: string,
    userAgent?: string
  ) {
    const userId = await this.validateApiKey(apiKey);
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    
    // Start measuring response time
    const startTime = Date.now();
    
    try {
      const result = await this.ordersService.findAll(seller.id);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      await this.logApiCall(
        seller.id, 
        'LIST_ORDERS', 
        200, 
        responseTime,
        { status },
        { count: result.length },
        clientIp,
        userAgent
      );
      
      return result;
    } catch (error) {
      // Log failed API call
      const responseTime = Date.now() - startTime;
      const status = error.status || 500;
      await this.logApiCall(
        seller.id, 
        'LIST_ORDERS', 
        status, 
        responseTime,
        { status },
        { error: error.message },
        clientIp,
        userAgent
      );
      
      throw error;
    }
  }

  async getOrderStatus(apiKey: string, orderId: string) {
    const userId = await this.validateApiKey(apiKey);
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });
    
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    
    // Start measuring response time
    const startTime = Date.now();
    
    try {
      const order = await this.ordersService.findOne(userId, orderId);
      
      // Log successful API call
      const responseTime = Date.now() - startTime;
      await this.logApiCall(seller.id, 'GET_ORDER_STATUS', 200, responseTime);
      
      return { status: order.status };
    } catch (error) {
      // Log failed API call
      const responseTime = Date.now() - startTime;
      const status = error.status || 500;
      await this.logApiCall(seller.id, 'GET_ORDER_STATUS', status, responseTime);
      
      throw error;
    }
  }

  // Helper method to log API calls
  private async logApiCall(
    sellerId: string, 
    endpoint: string, 
    status: number, 
    responseTime: number,
    requestBody?: any,
    responseBody?: any,
    ip?: string,
    userAgent?: string
  ) {
    try {
      // Create a data object with only the fields defined in the schema
      const logData: any = {
        sellerId,
        endpoint,
        status,
        responseTime,
        timestamp: new Date()
      };
      
      // Only add these fields if they exist in the schema
      if (ip) logData.ip = ip;
      if (userAgent) logData.userAgent = userAgent;
      
      await this.prisma.apiLog.create({
        data: logData
      });
    } catch (error) {
      // Silent fail if logging fails - don't affect the main API response
      console.error('Failed to log API call:', error);
    }
  }
} 