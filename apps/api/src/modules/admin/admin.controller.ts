import { Controller, Get, Post, Body, Param, Delete, UseGuards, Put, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { AdminService } from './admin.service';
import { AdminGuard } from '@/common/guards/admin.guard';
import { Role as PrismaRole } from '@prisma/client';

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
  async createWarehouseManager(@Body() createWarehouseManagerDto: {
    name: string;
    email: string;
    warehouseId: string;
  }) {
    return this.adminService.createWarehouseManager(createWarehouseManagerDto);
  }

  @Patch('warehouse-managers/:id/status')
  async updateWarehouseManagerStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: { status: 'active' | 'inactive' }
  ) {
    return this.adminService.updateWarehouseManagerStatus(id, updateStatusDto.status);
  }

  @Delete('warehouse-managers/:id')
  async removeWarehouseManager(@Param('id') id: string) {
    return this.adminService.removeWarehouseManager(id);
  }

  // User Management
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('roles') roles: PrismaRole[],
  ) {
    return this.adminService.updateUserRole(id, roles);
  }

  // Warehouse Management
  @Get('warehouses')
  async getAllWarehouses() {
    return this.adminService.getAllWarehouses();
  }

  @Get('warehouses/:id')
  async getWarehouseById(@Param('id') id: string) {
    return this.adminService.getWarehouseById(id);
  }

  // System Statistics
  @Get('statistics')
  async getSystemStatistics() {
    return this.adminService.getSystemStatistics();
  }

  // Audit Logs
  @Get('audit-logs')
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}