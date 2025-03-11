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

  async approveDriver(driverId: string) {
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
      data: { isVerifiedDriver: true },
    });

    return driver;
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

    // Let's check what fields are available on the driver model
    console.log('Available fields on driver model:', Object.keys(driver));
    
    // Try using the enum directly
    const updatedDriver = await this.prisma.$executeRaw`
      UPDATE "Driver" 
      SET "availabilityStatus" = ${status}:::"DriverStatus" 
      WHERE "id" = ${driver.id}
    `;

    // Fetch the updated driver
    const updatedDriverData = await this.prisma.driver.findUnique({
      where: { id: driver.id }
    });

    return updatedDriverData;
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