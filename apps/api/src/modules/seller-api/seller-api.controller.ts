import { Controller, Post, Get, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { SellerApiService } from './seller-api.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { ApiKeyGuard } from '@/guards/api-key.guard';

@Controller('seller-api')
export class SellerApiController {
  constructor(private readonly sellerApiService: SellerApiService) {}

  @Post('generate-key')
  async generateApiKey(@Req() req: any) {
    if (!req.user || !req.user.id) throw new UnauthorizedException();
    return this.sellerApiService.generateApiKey(req.user.id);
  }

  @Post('revoke-key')
  @UseGuards(ApiKeyGuard)
  async revokeApiKey(@Req() req: any) {
    return this.sellerApiService.revokeApiKey(req.headers['x-api-key'] as string);
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