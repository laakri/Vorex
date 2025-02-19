import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpCode,
    NotFoundException,
    InternalServerErrorException,
  } from '@nestjs/common';
  import { DeliveryService } from './delivery.service';
  import { CreateDeliveryDto } from './dto/create-delivery.dto';
  import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
  import { RolesGuard } from '@/common/guards/roles.guard';
  import { Roles } from '@/common/decorators/roles.decorator';
  import { Role } from '@/common/enums/role.enum';
  import { GetUser } from '@/common/decorators/get-user.decorator';
  
  @Controller('deliveries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class DeliveryController {
    constructor(private readonly deliveryService: DeliveryService) {}
  
    @Post()
    @HttpCode(201)
    @Roles(Role.SELLER)
    async createDelivery(
      @GetUser('id') userId: string,
      @Body() createDeliveryDto: CreateDeliveryDto
    ) {
      try {
        return await this.deliveryService.createDelivery(userId, createDeliveryDto);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to create delivery');
      }
    }
  }