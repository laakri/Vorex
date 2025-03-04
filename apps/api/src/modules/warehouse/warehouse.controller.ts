import { Controller, Post, Body, Get } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { Warehouse } from '@prisma/client';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  async createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehouseService.createWarehouse(createWarehouseDto);
  }
  @Get()
  async getWarehouses(): Promise<Warehouse[]> {
    return this.warehouseService.getWarehouses();
  }
}