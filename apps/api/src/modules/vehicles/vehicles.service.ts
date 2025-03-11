import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ReportVehicleIssueDto } from './dto/report-vehicle-issue.dto';
import { VehicleStatus } from '@prisma/client';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private prisma: PrismaService) {}

  async getDriverByUserId(userId: string) {
    return this.prisma.driver.findUnique({
      where: { userId }
    });
  }

  async getDriverVehicle(userId: string) {
    // Get the driver with their vehicle
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        vehicle: {
          include: {
            maintenanceRecords: {
              orderBy: { date: 'desc' }
            },
            issues: {
              orderBy: { reportedAt: 'desc' }
            }
          }
        }
      }
    });

    if (!driver || !driver.vehicle) {
      return null;
    }

    const vehicle = driver.vehicle;

    // Format the response
    return {
      id: vehicle.id,
      type: vehicle.type,
      make: vehicle.make || 'Unknown',
      model: vehicle.model || 'Model',
      year: vehicle.year || 2023,
      licensePlate: vehicle.plateNumber,
      vin: vehicle.id.substring(0, 17).toUpperCase(),
      status: vehicle.currentStatus,
      fuelType: vehicle.type === 'MOTORCYCLE' ? 'GASOLINE' : 'DIESEL',
      fuelLevel: Math.floor(Math.random() * 100), // Mock data
      odometer: vehicle.odometer ,
      lastMaintenanceDate: vehicle.lastMaintenance?.toISOString() || 
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextMaintenanceDate: vehicle.nextMaintenance?.toISOString() || 
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceRecords: vehicle.maintenanceRecords.map(record => ({
        id: record.id,
        type: record.type,
        date: record.date.toISOString(),
        odometer: record.odometer,
        description: record.description,
        cost: record.cost,
        status: record.status
      })),
      issues: vehicle.issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        reportedAt: issue.reportedAt.toISOString(),
        status: issue.status,
        priority: issue.priority
      })),
      insurance: {
        provider: "SafeDrive Insurance",
        policyNumber: `POL-${vehicle.id.substring(0, 6)}`,
        coverage: "Comprehensive",
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  async getVehicleMaintenanceRecords(vehicleId: string) {
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' }
    });

    return records.map(record => ({
      id: record.id,
      type: record.type,
      date: record.date.toISOString(),
      odometer: record.odometer,
      description: record.description,
      cost: record.cost,
      status: record.status
    }));
  }

  async createMaintenanceRecord(vehicleId: string, data: CreateMaintenanceRecordDto) {
    const record = await this.prisma.maintenanceRecord.create({
      data: {
        ...data,
        vehicleId,
        date: new Date(data.date)
      }
    });

    // Update vehicle's last maintenance date
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { 
        lastMaintenance: new Date(data.date),
        nextMaintenance: new Date(new Date(data.date).getTime() + 180 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      id: record.id,
      type: record.type,
      date: record.date.toISOString(),
      odometer: record.odometer,
      description: record.description,
      cost: record.cost,
      status: record.status
    };
  }

  async getVehicleIssues(vehicleId: string) {
    const issues = await this.prisma.vehicleIssue.findMany({
      where: { vehicleId },
      orderBy: { reportedAt: 'desc' }
    });

    return issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      reportedAt: issue.reportedAt.toISOString(),
      status: issue.status,
      priority: issue.priority
    }));
  }

  async reportVehicleIssue(vehicleId: string, issueData: ReportVehicleIssueDto) {
    const issue = await this.prisma.vehicleIssue.create({
      data: {
        ...issueData,
        vehicleId
      }
    });

    // If the issue is high priority, update vehicle status
    if (issueData.priority === 'HIGH') {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentStatus: VehicleStatus.MAINTENANCE }
      });
    }

    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      reportedAt: issue.reportedAt.toISOString(),
      status: issue.status,
      priority: issue.priority
    };
  }

  async updateIssueStatus(issueId: string, status: string) {
    const issue = await this.prisma.vehicleIssue.update({
      where: { id: issueId },
      data: { status }
    });

    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      reportedAt: issue.reportedAt.toISOString(),
      status: issue.status,
      priority: issue.priority
    };
  }
} 