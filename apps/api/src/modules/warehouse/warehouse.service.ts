import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { Warehouse } from '@prisma/client';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async createWarehouse(createWarehouseDto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: createWarehouseDto.name,
        address: createWarehouseDto.address,
        city: createWarehouseDto.city,
        governorate: createWarehouseDto.governorate,
        postalCode: createWarehouseDto.postalCode,
        phone: createWarehouseDto.phone,
        capacity: createWarehouseDto.capacity,
        currentLoad: 0,
        latitude: createWarehouseDto.latitude,
        longitude: createWarehouseDto.longitude,
      },
    });
  }
  async getWarehouses(): Promise<Warehouse[]> {
    return this.prisma.warehouse.findMany({
      include: {
        managers: true, // Include related managers if needed
        sections: true, // Include related sections if needed
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date
      },
    });
  }
}