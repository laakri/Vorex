import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException, HttpCode } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AssignOrderLocationDto } from './dto/assign-order-location.dto';
import { CreateWarehouseSectionDto } from './dto/create-warehouse-section.dto';
import { CreatePileDto } from './dto/create-pile.dto';
import { Role } from '@/common/enums/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  async getAllWarehouses() {
    try {
      return await this.warehouseService.getWarehouses();
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new InternalServerErrorException('Failed to fetch warehouses');
    }
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  async getWarehouseById(@Param('id') id: string) {
    try {
      return await this.warehouseService.getWarehouseById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch warehouse');
    }
  }

  @Post()
  @HttpCode(201)
  @Roles(Role.ADMIN)
  async createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    try {
      return await this.warehouseService.createWarehouse(createWarehouseDto);
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw new InternalServerErrorException('Failed to create warehouse');
    }
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  async updateWarehouse(
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto
  ) {
    try {
      return await this.warehouseService.updateWarehouse(id, updateWarehouseDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update warehouse');
    }
  }

  @Get(':id/sections')
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  async getWarehouseSections(@Param('id') warehouseId: string) {
    try {
      return await this.warehouseService.getWarehouseSections(warehouseId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch warehouse sections');
    }
  }

  @Post(':id/sections')
  @HttpCode(201)
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  async createWarehouseSection(
    @Param('id') warehouseId: string,
    @Body() createSectionDto: CreateWarehouseSectionDto
  ) {
    try {
      return await this.warehouseService.createWarehouseSection(warehouseId, createSectionDto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create warehouse section');
    }
  }

  @Post('sections/:sectionId/piles')
  @HttpCode(201)
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  async createPile(
    @Param('sectionId') sectionId: string,
    @Body() createPileDto: CreatePileDto
  ) {
    try {
      return await this.warehouseService.createPile(sectionId, createPileDto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create pile');
    }
  }

  @Get(':id/incoming-orders')
  @Roles(Role.WAREHOUSE_MANAGER)
  async getIncomingOrders(
    @Param('id') warehouseId: string,
    @Query('status') status?: string
  ) {
    try {
      return await this.warehouseService.getIncomingWarehouseOrders(warehouseId, status);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch incoming orders');
    }
  }

  @Get(':id/outgoing-orders')
  @Roles(Role.WAREHOUSE_MANAGER)
  async getOutgoingOrders(
    @Param('id') warehouseId: string,
    @Query('status') status?: string
  ) {
    try {
      return await this.warehouseService.getOutgoingWarehouseOrders(warehouseId, status);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch outgoing orders');
    }
  }

  @Put('orders/:orderId/location')
  @Roles(Role.WAREHOUSE_MANAGER)
  async assignOrderLocation(
    @Param('orderId') orderId: string,
    @Body() assignLocationDto: AssignOrderLocationDto,
    @GetUser() user: any
  ) {
    try {
      return await this.warehouseService.assignOrderLocation(
        orderId, 
        assignLocationDto,
        user.id
      );
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to assign order location');
    }
  }

  @Put('orders/:orderId/status')
  @Roles(Role.WAREHOUSE_MANAGER)
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() { status }: { status: string },
    @GetUser() user: any
  ) {
    try {
      return await this.warehouseService.updateOrderStatus(orderId, status, user.id);
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update order status');
    }
  }

  @Get(':id/routes')
  @Roles(Role.WAREHOUSE_MANAGER)
  async getWarehouseRoutes(@Param('id') warehouseId: string) {
    try {
      return await this.warehouseService.getWarehouseRoutes(warehouseId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch warehouse routes');
    }
  }

  @Get(':id/inventory')
  @Roles(Role.WAREHOUSE_MANAGER)
  async getWarehouseInventory(@Param('id') warehouseId: string) {
    try {
      return await this.warehouseService.getWarehouseInventory(warehouseId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch warehouse inventory');
    }
  }
}