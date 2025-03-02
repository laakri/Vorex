import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { DriverStatus,  } from '@prisma/client';
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

    // Validation checks
    await this.validateDriverRegistration(createDriverDto, createVehicleDto);

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
          currentStatus: createVehicleDto.currentStatus,
          lastMaintenance: createVehicleDto.lastMaintenance,
          nextMaintenance: createVehicleDto.nextMaintenance,
        }
      });

      // Create driver profile
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
          availabilityStatus: DriverStatus.OFF_DUTY,
        }
      });

      // Update user role to DRIVER
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          role: Role.DRIVER
        }
      });

      return { driver, vehicle, user: updatedUser };
    });

    // Notify admins about new driver registration
    await this.notifyAdminsNewDriver(result);

    return result;
  }

  async approveDriver(driverId: string) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: { user: true }
      });

      if (!driver) {
        throw new BadRequestException('Driver not found');
      }

      // Update driver status
      const updatedDriver = await prisma.driver.update({
        where: { id: driverId },
        data: {
          availabilityStatus: DriverStatus.AVAILABLE
        },
        include: { user: true }
      });

      // Update user verification status
      await prisma.user.update({
        where: { id: driver.userId },
        data: {
          role: Role.DRIVER,
        }
      });

      return updatedDriver;
    });

    // Send approval email
    await this.emailService.sendEmail({
      to: result.user.email,
      subject: 'Driver Registration Approved',
      template: EmailTemplate.DRIVER_WELCOME,
      context: {
        driverName: result.user.fullName,
        licenseType: result.licenseType,
      }
    });

    return result;
  }

  async rejectDriver(driverId: string, reason: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true }
    });

    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Delete vehicle if exists
      if (driver.vehicleId) {
        await prisma.vehicle.delete({
          where: { id: driver.vehicleId }
        });
      }

      // Delete driver
      await prisma.driver.delete({
        where: { id: driverId }
      });

      // Update user
      await prisma.user.update({
        where: { id: driver.userId },
        data: {
          role: Role.SELLER,
        }
      });
    });

    // Send rejection email
    await this.emailService.sendEmail({
      to: driver.user.email,
      subject: 'Driver Registration Not Approved',
      template: EmailTemplate.DRIVER_REJECTED,
      context: {
        driverName: driver.user.fullName,
        reason
      }
    });

    return { message: 'Driver registration rejected' };
  }

  private async validateDriverRegistration(driver: CreateDriverDto, vehicle: CreateVehicleDto) {
    // Check if license number is unique
    const existingLicense = await this.prisma.driver.findUnique({
      where: { licenseNumber: driver.licenseNumber }
    });

    if (existingLicense) {
      throw new BadRequestException('License number already exists');
    }

    // Check if plate number is unique
    const existingPlate = await this.prisma.vehicle.findUnique({
      where: { plateNumber: vehicle.plateNumber }
    });

    if (existingPlate) {
      throw new BadRequestException('Plate number already exists');
    }
  }

  private async notifyAdminsNewDriver(data: { driver: any; vehicle: any; user: any }) {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN }
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