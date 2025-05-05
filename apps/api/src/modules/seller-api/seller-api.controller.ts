import { Controller, Post, Get, Body, Param, UseGuards, Req, UnauthorizedException, HttpCode } from '@nestjs/common';
import { SellerApiService } from './seller-api.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { Request } from 'express';

@Controller('seller-api')
export class SellerApiController {
  constructor(private readonly sellerApiService: SellerApiService) {}

  @Get('me')
  async getApiKey(@Req() req: Request) {
    if (!req.user || !req.user['id']) throw new UnauthorizedException();
    const apiKey = await this.sellerApiService.getApiKey(req.user['id']);
    const stats = await this.sellerApiService.getApiStats(req.user['id']);
    return { apiKey, stats };
  }

  @Get('history')
  async getApiHistory(@Req() req: Request) {
    if (!req.user || !req.user['id']) throw new UnauthorizedException();
    return this.sellerApiService.getApiHistory(req.user['id']);
  }

  @Post('generate-key')
  @HttpCode(200)
  async generateApiKey(@Req() req: Request) {
    if (!req.user || !req.user['id']) throw new UnauthorizedException();
    return this.sellerApiService.generateApiKey(req.user['id']);
  }

  @Post('revoke-key')
  @HttpCode(200)
  async revokeApiKey(@Req() req: Request) {
    if (!req.user || !req.user['id']) throw new UnauthorizedException();
    await this.sellerApiService.revokeApiKey(req.user['id']);
    return { success: true };
  }

  @Post('orders')
  @UseGuards(ApiKeyGuard)
  async createOrder(@Req() req: Request, @Body() createOrderDto: CreateOrderDto) {
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    
    return this.sellerApiService.createOrder(
      req.headers['x-api-key'] as string, 
      createOrderDto,
      clientIp,
      userAgent
    );
  }

  @Get('orders')
  @UseGuards(ApiKeyGuard)
  async listOrders(@Req() req: Request) {
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    
    return this.sellerApiService.listOrders(
      req.headers['x-api-key'] as string,
      undefined,
      clientIp,
      userAgent
    );
  }

  @Get('orders/:id')
  @UseGuards(ApiKeyGuard)
  async getOrder(@Req() req: Request, @Param('id') id: string) {
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    
    return this.sellerApiService.getOrder(
      req.headers['x-api-key'] as string, 
      id,
      clientIp,
      userAgent
    );
  }

  @Get('orders/:id/status')
  @UseGuards(ApiKeyGuard)
  async getOrderStatus(@Req() req: any, @Param('id') id: string) {
    return this.sellerApiService.getOrderStatus(req.headers['x-api-key'] as string, id);
  }

  // Helper method to get client IP
  private getClientIp(req: Request): string {
    return req.ip || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
           req.socket.remoteAddress || 
           '';
  }
} 