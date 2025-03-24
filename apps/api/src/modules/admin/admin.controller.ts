import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('warehouse-managers')
  async getWarehouseManagers() {
    return this.adminService.getWarehouseManagers();
  }

  @Post('warehouse-managers')
  async assignWarehouseManager(@Body() data: { userId: string; warehouseId: string }) {
    return this.adminService.assignWarehouseManager(data.userId, data.warehouseId);
  }

  @Delete('warehouse-managers/:id')
  async removeWarehouseManager(@Param('id') id: string) {
    return this.adminService.removeWarehouseManager(id);
  }
}