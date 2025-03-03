import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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