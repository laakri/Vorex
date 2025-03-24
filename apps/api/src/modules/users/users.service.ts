import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        seller: true,
        driver: true,
        warehouseManager: {
          select: {
            id: true,
            warehouseId: true,
            employeeId: true,
            securityClearance: true,
          }
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add warehouseId to the user object if they are a warehouse manager
    const result = {
      ...user,
      warehouseId: user.warehouseManager?.warehouseId || null
    };

    return result;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        warehouseManager: {
          select: {
            id: true,
            warehouseId: true
          }
        }
      },
    });

    if (!user) return null;

    // Add warehouseId to the user object if they are a warehouse manager
    return {
      ...user,
      warehouseId: user.warehouseManager?.warehouseId || null
    };
  }

  async getUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true, 
          email: true, 
          fullName: true, 
          role: true, 
          createdAt: true,
          // Include warehouseManager to check if they're already assigned
          warehouseManager: {
            select: {
              id: true,
              warehouseId: true
            }
          }
        }
      });
      
      // Transform the users to include warehouseId at the top level
      const transformedUsers = users.map(user => ({
        ...user,
        warehouseId: user.warehouseManager?.warehouseId || null
      }));
      
      console.log(`Retrieved ${transformedUsers.length} users`);
      return transformedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            isVerified: true,
          },
        },
        driver: {
          select: {
            id: true,
            licenseNumber: true,
            availabilityStatus: true,
            rating: true,
          },
        },
        warehouseManager: {
          select: {
            id: true,
            employeeId: true,
            securityClearance: true,
            warehouseId: true,
            warehouse: {
              select: {
                id: true,
                name: true,
                city: true,
                governorate: true
              }
            }
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add warehouseId to the user object if they are a warehouse manager
    return {
      ...user,
      warehouseId: user.warehouseManager?.warehouseId || null
    };
  }
}
