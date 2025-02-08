import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { OrderStatus } from '@prisma/client';

@Controller('sellers/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@GetUser('id') sellerId: string, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(sellerId, createOrderDto);
  }

  @Get()
  findAll(@GetUser('id') sellerId: string) {
    return this.ordersService.findAll(sellerId);
  }

  @Get(':id')
  findOne(@GetUser('id') sellerId: string, @Param('id') id: string) {
    return this.ordersService.findOne(sellerId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @GetUser('id') sellerId: string,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(sellerId, id, status);
  }
} 