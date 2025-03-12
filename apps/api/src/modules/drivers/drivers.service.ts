import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateDriverVehicleDto } from './dto/update-driver-vehicle.dto';
import { DriverStatus, LicenseType } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { EmailTemplate } from '../email/email.service';
import { Role } from '@/common/enums/role.enum';

// Define interfaces for the return types
export interface DailyEarning {
  date: string;
  earnings: number;
  deliveries: number;
}

export interface DeliveryType {
  name: string;
  count: number;
  percentage: number;
}

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async register(userId: string, createDriverDto: CreateDriverDto, createVehicleDto: CreateVehicleDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true }
    });

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    if (existingUser.driver) {
      throw new BadRequestException('User is already a driver');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      // Create vehicle first
      const vehicle = await prisma.vehicle.create({
        data: {
          plateNumber: createVehicleDto.plateNumber,
          type: createVehicleDto.type,
          make: createVehicleDto.make,
          model: createVehicleDto.model,
          year: createVehicleDto.year,
          capacity: createVehicleDto.capacity,
          maxWeight: createVehicleDto.maxWeight,
          currentStatus: 'ACTIVE',          
          lastMaintenance: createVehicleDto.lastMaintenance,
          nextMaintenance: createVehicleDto.nextMaintenance,
        }
      });

      // Create driver profile without availabilityStatus
      const driver = await prisma.driver.create({
        data: {
          userId,
          licenseNumber: createDriverDto.licenseNumber,
          licenseType: createDriverDto.licenseType,
          licenseExpiry: createDriverDto.licenseExpiry,
          vehicleId: vehicle.id,
          address: createDriverDto.address,
          city: createDriverDto.city,
          postalCode: createDriverDto.postalCode,
          governorate: createDriverDto.governorate,
          phone: createDriverDto.phone,
          emergencyContact: createDriverDto.emergencyContact,
        }
      });

      // Update user role to include DRIVER only upon approval
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: [...new Set([...existingUser.role, Role.DRIVER])] 
        }
      });

      return { driver, vehicle, user: updatedUser };
    });

    // Notify admins about new driver registration
    await this.notifyAdminsNewDriver(result);

    return result;
  }

  async approveDriver(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true },
    });

    if (!user || !user.driver) {
      throw new NotFoundException('Driver not found');
    }

    // Update the user's verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerifiedDriver: true },
    });

    return { user, driver: user.driver };
  }

  async rejectDriver(driverId: string, reason: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Update the driver's verification status
    await this.prisma.user.update({
      where: { id: driver.userId },
      data: { isVerifiedDriver: false },
    });

    return driver;
  }

  async getDriverProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isVerifiedDriver: true,
            role: true
          }
        },
        vehicle: true
      }
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return {
      driver: {
        id: driver.id,
        licenseNumber: driver.licenseNumber,
        licenseType: driver.licenseType,
        licenseExpiry: driver.licenseExpiry,
        address: driver.address,
        city: driver.city,
        postalCode: driver.postalCode,
        governorate: driver.governorate,
        phone: driver.phone,
        emergencyContact: driver.emergencyContact,
      },
      user: driver.user,
      vehicle: driver.vehicle
    };
  }

  async updateDriverProfile(userId: string, updateDriverDto: UpdateDriverProfileDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        licenseNumber: updateDriverDto.licenseNumber,
        licenseType: updateDriverDto.licenseType as LicenseType,
        licenseExpiry: updateDriverDto.licenseExpiry,
        address: updateDriverDto.address,
        city: updateDriverDto.city,
        postalCode: updateDriverDto.postalCode,
        governorate: updateDriverDto.governorate,
        phone: updateDriverDto.phone,
        emergencyContact: updateDriverDto.emergencyContact,
      }
    });

    return updatedDriver;
  }

  async updateDriverVehicle(userId: string, updateVehicleDto: UpdateDriverVehicleDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { vehicle: true }
    });

    if (!driver || !driver.vehicle) {
      throw new NotFoundException('Driver vehicle not found');
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: driver.vehicle.id },
      data: updateVehicleDto
    });

    return updatedVehicle;
  }

  async updateDriverAvailability(userId: string, status: DriverStatus) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    
    // Update driver with standard Prisma update - avoid raw SQL
    const updatedDriver = await this.prisma.driver.update({
      where: { id: driver.id },
      data: { availabilityStatus: status }
    });

    return updatedDriver;
  }

  async getDriverDashboard(userId: string, timeRange: string) {
    // Validate driver exists
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { vehicle: true }
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Determine date range
    const now = new Date();
    let startDate: Date;
    
    switch(timeRange) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get completed routes
    const completedRoutes = await this.prisma.deliveryRoute.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate
        }
      },
      include: {
        stops: true,
        batch: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Calculate total earnings (mock calculation based on distance and packages)
    const totalEarnings = completedRoutes.reduce((sum, route) => {
      // Simple earnings calculation (can be replaced with actual business logic)
      const baseEarnings = route.batch?.totalWeight ? route.batch.totalWeight * 0.5 : 20;
      const stopBonus = (route.stops?.length || 0) * 2;
      return sum + baseEarnings + stopBonus;
    }, 0);

    // Calculate total distance
    const totalDistance = completedRoutes.reduce((sum, route) => {
      return sum + (route.totalDistance || 0);
    }, 0);

    // Get recent deliveries
    const recentDeliveries = completedRoutes.slice(0, 5).map(route => {
      // Extract route info for display
      const routeDesc = route.fromWarehouseId && route.toWarehouseId 
        ? `${route.fromWarehouseId} to ${route.toWarehouseId}`
        : 'Local Delivery';
      
      const packages = route.batch?.orderCount || route.stops.filter(s => !s.isPickup).length;
      
      // Calculate earnings for this route
      const baseEarnings = route.batch?.totalWeight ? route.batch.totalWeight * 0.5 : 20;
      const stopBonus = (route.stops?.length || 0) * 2;
      const earnings = baseEarnings + stopBonus;

      return {
        id: route.id,
        route: routeDesc,
        packages,
        distance: route.totalDistance || 0,
        status: 'Completed',
        earnings: earnings.toFixed(2),
        completedAt: route.completedAt
      };
    });

    // Calculate daily earnings data
    const dailyEarnings = await this.generateDailyEarningsData(startDate, completedRoutes);

    // Calculate success rate and on-time delivery rate
    const allRoutes = await this.prisma.deliveryRoute.count({
      where: {
        driverId: driver.id,
        startedAt: {
          gte: startDate
        }
      }
    });

    const successRate = allRoutes > 0 
      ? Math.round((completedRoutes.length / allRoutes) * 100) 
      : 0;

    // Get on-time deliveries (completed within expected timeframe)
    const onTimeDeliveries = completedRoutes.filter(route => {
      // Simple on-time logic - can be replaced with actual business rules
      return route.completedAt && route.batch.completedTime && 
             new Date(route.completedAt) <= new Date(route.batch.completedTime);
    }).length;

    const onTimeRate = completedRoutes.length > 0 
      ? Math.round((onTimeDeliveries / completedRoutes.length) * 100) 
      : 0;

    // Calculate delivery types
    const deliveryTypes = this.calculateDeliveryTypes(completedRoutes);

    return {
      deliveryMetrics: {
        completed: completedRoutes.length,
        earnings: parseFloat(totalEarnings.toFixed(2)),
        totalDistance: parseFloat(totalDistance.toFixed(2))
      },
      vehicleInfo: {
        type: driver.vehicle?.type || 'N/A',
        status: driver.vehicle?.currentStatus || 'INACTIVE',
        lastMaintenance: driver.vehicle?.lastMaintenance || null,
        nextMaintenance: driver.vehicle?.nextMaintenance || null
      },
      earningsData: {
        daily: dailyEarnings,
        byType: deliveryTypes
      },
      recentDeliveries,
      performanceStats: {
        rating: 4.8, // Mock data - would come from actual ratings
        onTimeDelivery: onTimeRate,
        successRate
      }
    };
  }

  private async generateDailyEarningsData(startDate: Date, completedRoutes: any[]) {
    const result: DailyEarning[] = [];
    const endDate = new Date();
    const currentDate = new Date(startDate);
    
    // Create a map of dates to earnings
    const earningsByDate = new Map();
    
    completedRoutes.forEach(route => {
      if (route.completedAt) {
        const dateStr = new Date(route.completedAt).toISOString().split('T')[0];
        
        // Calculate earnings for this route
        const baseEarnings = route.batch?.totalWeight ? route.batch.totalWeight * 0.5 : 20;
        const stopBonus = (route.stops?.length || 0) * 2;
        const earnings = baseEarnings + stopBonus;
        
        const current = earningsByDate.get(dateStr) || 0;
        earningsByDate.set(dateStr, current + earnings);
      }
    });
    
    // Fill in the data for each day in the range
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      result.push({
        date: formattedDate,
        earnings: parseFloat((earningsByDate.get(dateStr) || 0).toFixed(2)),
        deliveries: completedRoutes.filter(r => 
          r.completedAt && new Date(r.completedAt).toISOString().split('T')[0] === dateStr
        ).length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }

  private calculateDeliveryTypes(completedRoutes: any[]) {
    const typeCount = new Map();
    let total = 0;
    
    // Count routes by type
    completedRoutes.forEach(route => {
      let type = 'Standard';
      
      if (route.fromWarehouse && route.toWarehouse) {
        type = 'Warehouse Transfer';
      } else if (route.batch?.type === 'EXPRESS') {
        type = 'Express';
      }
      
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
      total++;
    });
    
    // Convert to percentage and format for frontend
    const result: DeliveryType[] = [];
    
    typeCount.forEach((count, name) => {
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      
      result.push({
        name: name as string,
        count: count as number,
        percentage
      });
    });
    
    // If no data, provide default categories
    if (result.length === 0) {
      return [
        { name: 'Standard', count: 0, percentage: 0 },
        { name: 'Express', count: 0, percentage: 0 },
        { name: 'Warehouse Transfer', count: 0, percentage: 0 }
      ];
    }
    
    return result;
  }

  private async notifyAdminsNewDriver(data: { driver: any; vehicle: any; user: any }) {
    const admins = await this.prisma.user.findMany({
      where: { role: { has: Role.ADMIN } }
    });

    await Promise.all(
      admins.map(admin =>
        this.emailService.sendEmail({
          to: admin.email,
          subject: 'New Driver Registration',
          template: EmailTemplate.ADMIN_DRIVER_REVIEW,
          context: {
            adminName: admin.fullName,
            driver: {
              name: data.user.fullName,
              license: data.driver.licenseNumber,
              vehicle: data.vehicle
            }
          }
        })
      )
    );
  }
} 