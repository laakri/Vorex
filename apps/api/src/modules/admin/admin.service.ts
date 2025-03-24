// apps/api/src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getWarehouseManagers() {
    return this.prisma.warehouseManager.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
            governorate: true
          }
        }
      }
    });
  }

  async assignWarehouseManager(userId: string, warehouseId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });
    
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.warehouseManager.findFirst({
      where: {
        userId,
        warehouseId
      }
    });
    
    if (existingAssignment) {
      throw new BadRequestException('This user is already assigned to this warehouse');
    }

    // Generate a unique employee ID
    const employeeId = `EMP-${uuidv4().substring(0, 8)}`;

    // Start a transaction to update both the user role and create the warehouse manager
    return this.prisma.$transaction(async (prisma) => {
      // Update user role to include WAREHOUSE_MANAGER if not already present
      if (!user.role.includes('WAREHOUSE_MANAGER')) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            role: [...user.role, 'WAREHOUSE_MANAGER']
          }
        });
      }

      // Create the warehouse manager assignment
      const data: Prisma.WarehouseManagerCreateInput = {
        user: {
          connect: { id: userId }
        },
        warehouse: {
          connect: { id: warehouseId }
        },
        employeeId: employeeId,
        securityClearance: 'BASIC',
        shiftPreference: 'MORNING',
        emergencyContact: ''
      };

      return prisma.warehouseManager.create({
        data,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              city: true,
              governorate: true
            }
          }
        }
      });
    });
  }

  async removeWarehouseManager(id: string) {
    // Get the assignment to find the user
    const assignment = await this.prisma.warehouseManager.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
    
    if (!assignment) {
      throw new NotFoundException(`Warehouse manager assignment with ID ${id} not found`);
    }

    // Start a transaction to update both the user role and delete the warehouse manager
    return this.prisma.$transaction(async (prisma) => {
      // Delete the assignment
      await prisma.warehouseManager.delete({
        where: { id }
      });
      
      // Check if user has other warehouse manager assignments
      const otherAssignments = await prisma.warehouseManager.findFirst({
        where: {
          userId: assignment.userId
        }
      });
      
      // If no other assignments, remove WAREHOUSE_MANAGER role
      if (!otherAssignments) {
        const user = await prisma.user.findUnique({
          where: { id: assignment.userId }
        });
        
        await prisma.user.update({
          where: { id: assignment.userId },
          data: {
            role: user?.role?.filter(role => role !== 'WAREHOUSE_MANAGER') || []
          }
        });
      }
      return { success: true };
    });
  }
}