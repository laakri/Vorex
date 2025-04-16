import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  NotFoundException,
  HttpCode,
  Request,
  InternalServerErrorException,
  BadRequestException,
  Req,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { OrderStatus } from '@prisma/client';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { DeliveryPricingService } from './delivery-pricing.service';
import { DeliveryPricePreview } from './types/delivery-pricing.types';
import { DeliveryTimeEstimationService } from './delivery-time-estimation.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';

@Controller('orders')
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('track/:trackingId')
  async getTrackingInfo(@Param('trackingId') trackingId: string) {
    console.log(`Tracking request received for ID: ${trackingId}`);
    try {
      const result = await this.ordersService.getPublicTrackingInfo(trackingId);
      console.log(`Successfully retrieved tracking for order: ${trackingId}`);
      return result;
    } catch (error) {
      console.error('Error fetching tracking information:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch tracking information');
    }
  }

  @Get(':orderId/invoice')
  async getInvoiceData(@Param('orderId') orderId: string) {
    try {
      return await this.ordersService.getInvoiceData(orderId);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch invoice data');
    }
  }

  @Get(':orderId/invoice/download')
  async downloadInvoice(@Param('orderId') orderId: string, @Res() res: any) {
    try {
      const pdfBuffer = await this.ordersService.generateInvoicePDF(orderId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate invoice PDF');
    }
  }
}

@Controller('sellers/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly deliveryPricingService: DeliveryPricingService,
    private readonly deliveryTimeEstimationService: DeliveryTimeEstimationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('products')
  async findProducts(@GetUser('id') userId: string) {
    console.log('Finding products for user:', userId);
    
    // Get the seller with a more detailed query
    const seller = await this.prisma.seller.findFirst({
      where: { 
        userId,
        isVerified: true 
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    if (!seller) {
      console.log('No seller found for user:', userId);
      throw new NotFoundException('Seller not found');
    }
    
    console.log('Found seller:', {
      sellerId: seller.id,
      productCount: seller._count.products
    });
    
    return this.ordersService.findProducts(seller.id);
  }

  @Get()
  async findAll(@GetUser('id') userId: string) {
    console.log('Finding orders for user:', userId);
    const seller = await this.prisma.seller.findUnique({
      where: { userId }
    });
    
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return this.ordersService.findAll(seller.id);
  }

  @Post()
  @HttpCode(201)
  @Roles(Role.SELLER)
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    try {
      console.log('Creating order for user:', req.user.id);
      return await this.ordersService.create(req.user.id, createOrderDto);
    } catch (error) {
      console.error('Order creation failed:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  @Get(':id')
  findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.ordersService.findOne(userId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @GetUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(userId, orderId, updateOrderStatusDto.status);
  }

  @Post('preview-delivery-price')
  @Roles(Role.SELLER)
  async previewDeliveryPrice(
    @GetUser('id') userId: string,
    @Body() body: {
      items: Array<{
        weight: number;
        dimensions: string;
        quantity: number;
        fragile?: boolean;
        perishable?: boolean;
      }>;
      deliveryGovernorate: string;
    }
  ): Promise<DeliveryPricePreview> {
    return this.deliveryPricingService.calculateDeliveryPricePreview(
      userId,
      body.items,
      body.deliveryGovernorate
    );
  }

  @Get(':id/estimated-delivery-time')
  @Roles(Role.ADMIN, Role.SELLER, Role.WAREHOUSE_MANAGER, Role.DRIVER)
  async getEstimatedDeliveryTime(@Param('id', ParseUUIDPipe) id: string) {
    const estimatedTime = await this.deliveryTimeEstimationService.calculateEstimatedDeliveryTime(id);
    return { estimatedDeliveryTime: estimatedTime };
  }

  @Post(':id/update-delivery-time')
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  async updateDeliveryTime(@Param('id', ParseUUIDPipe) id: string) {
    await this.deliveryTimeEstimationService.updateOrderEstimatedDeliveryTime(id);
    return { message: 'Delivery time updated successfully' };
  }
} 