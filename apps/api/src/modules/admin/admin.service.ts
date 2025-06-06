// apps/api/src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // User Management
  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        driver: true,
        seller: true,
        warehouseManager: true,
      },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        driver: true,
        seller: true,
        warehouseManager: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateUserRole(id: string, roles: Role[]) {
    return this.prisma.user.update({
      where: { id },
      data: { role: roles },
    });
  }

  // Warehouse Management
  async getAllWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        managers: true,
        sections: true,
      },
    });
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        managers: true,
        sections: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  // System Statistics
  async getSystemStatistics() {
    const [
      totalUsers,
      totalSellers,
      totalDrivers,
      totalWarehouses,
      totalOrders,
      activeOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.seller.count(),
      this.prisma.driver.count(),
      this.prisma.warehouse.count(),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalSellers,
      totalDrivers,
      totalWarehouses,
      totalOrders,
      activeOrders,
    };
  }

  // Audit Logs
  async getAuditLogs() {
    return this.prisma.notification.findMany({
      where: {
        type: 'AUDIT',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  // Warehouse Manager methods
  async getWarehouseManagers() {
    return this.prisma.warehouseManager.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
            governorate: true,
          },
        },
      },
    });
  }

  async createWarehouseManager(createWarehouseManagerDto: {
    userId: string;
    warehouseId: string;
  }) {
    // First check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createWarehouseManagerDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createWarehouseManagerDto.userId} not found`);
    }

    // Check if the warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: createWarehouseManagerDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${createWarehouseManagerDto.warehouseId} not found`);
    }

    // Check if the user is already a manager of any warehouse
    const existingManager = await this.prisma.warehouseManager.findUnique({
      where: { userId: createWarehouseManagerDto.userId },
    });

    if (existingManager) {
      throw new BadRequestException('User is already assigned as a warehouse manager');
    }

    // Generate a unique employee ID
    const employeeId = `EMP-${uuidv4().substring(0, 8)}`;

    // Create the warehouse manager relationship
    const manager = await this.prisma.warehouseManager.create({
      data: {
        userId: createWarehouseManagerDto.userId,
        warehouseId: createWarehouseManagerDto.warehouseId,
        employeeId,
        securityClearance: 'BASIC',
        shiftPreference: 'MORNING',
        emergencyContact: '',
        specializations: [],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
            governorate: true,
          },
        },
      },
    });

    // Update user's role to include WAREHOUSE_MANAGER if not already present
    if (!user.role.includes(Role.WAREHOUSE_MANAGER)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: [...user.role, Role.WAREHOUSE_MANAGER],
        },
      });
    }

    return manager;
  }

  async updateWarehouseManagerStatus(id: string, status: 'active' | 'inactive') {
    const manager = await this.prisma.warehouseManager.findUnique({
      where: { id },
    });

    if (!manager) {
      throw new NotFoundException(`Warehouse manager with ID ${id} not found`);
    }

    // Instead of updating status directly, we'll update the user's role
    if (status === 'inactive') {
      // Remove WAREHOUSE_MANAGER role from user
      const user = await this.prisma.user.findUnique({
        where: { id: manager.userId },
      });

      if (user) {
        await this.prisma.user.update({
          where: { id: manager.userId },
          data: {
            role: user.role.filter(role => role !== Role.WAREHOUSE_MANAGER),
          },
        });
      }
    } else {
      // Add WAREHOUSE_MANAGER role to user
      const user = await this.prisma.user.findUnique({
        where: { id: manager.userId },
      });

      if (user && !user.role.includes(Role.WAREHOUSE_MANAGER)) {
        await this.prisma.user.update({
          where: { id: manager.userId },
          data: {
            role: [...user.role, Role.WAREHOUSE_MANAGER],
          },
        });
      }
    }

    return this.prisma.warehouseManager.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
            governorate: true,
          },
        },
      },
    });
  }

  async removeWarehouseManager(id: string) {
    const manager = await this.prisma.warehouseManager.findUnique({
      where: { id },
    });

    if (!manager) {
      throw new NotFoundException(`Warehouse manager with ID ${id} not found`);
    }

    // First delete the warehouse manager relationship
    await this.prisma.warehouseManager.delete({
      where: { id },
    });

    // Then delete the associated user
    await this.prisma.user.delete({
      where: { id: manager.userId },
    });

    return { message: 'Warehouse manager deleted successfully' };
  }
}