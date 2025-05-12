import { Controller, Post, Get, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { SellerApiService } from './seller-api.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('seller-api')
export class SellerApiController {
  constructor(private readonly sellerApiService: SellerApiService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getApiKey(@GetUser('id') userId: string) {
    const apiKey = await this.sellerApiService.getApiKey(userId);
    const stats = await this.sellerApiService.getApiStats(userId);
    return { apiKey, stats };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getApiHistory(@GetUser('id') userId: string) {
    return this.sellerApiService.getApiHistory(userId);
  }

  @Post('generate-key')
  @UseGuards(JwtAuthGuard)
  async generateApiKey(@GetUser('id') userId: string) {
    return this.sellerApiService.generateApiKey(userId);
  }

  @Post('revoke-key')
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(@GetUser('id') userId: string) {
    return this.sellerApiService.revokeApiKey(userId);
  }

  @Post('orders')
  @UseGuards(ApiKeyGuard)
  async createOrder(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.sellerApiService.createOrder(req.headers['x-api-key'] as string, createOrderDto);
  }

  @Get('orders')
  @UseGuards(ApiKeyGuard)
  async listOrders(@Req() req: any) {
    return this.sellerApiService.listOrders(req.headers['x-api-key'] as string);
  }

  @Get('orders/:id')
  @UseGuards(ApiKeyGuard)
  async getOrder(@Req() req: any, @Param('id') id: string) {
    return this.sellerApiService.getOrder(req.headers['x-api-key'] as string, id);
  }

  @Get('orders/:id/status')
  @UseGuards(ApiKeyGuard)
  async getOrderStatus(@Req() req: any, @Param('id') id: string) {
    return this.sellerApiService.getOrderStatus(req.headers['x-api-key'] as string, id);
  }
} 