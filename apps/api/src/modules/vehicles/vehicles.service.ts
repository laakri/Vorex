import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ReportVehicleIssueDto } from './dto/report-vehicle-issue.dto';
import { VehicleStatus } from '@prisma/client';

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
        vehicle: true
      }
    });

    if (!driver || !driver.vehicle) {
      return null;
    }

    // Get maintenance records
    const maintenanceRecords = await this.getVehicleMaintenanceRecords(driver.vehicle.id);
    
    // Get vehicle issues
    const issues = await this.getVehicleIssues(driver.vehicle.id);

    // Calculate fuel level (mock data for now)
    const fuelLevel = Math.floor(Math.random() * 100);

    return {
      id: driver.vehicle.id,
      type: driver.vehicle.type,
      make: driver.vehicle.make || 'Unknown',
      model: driver.vehicle.model || 'Model',
      year: driver.vehicle.year || 2023,
      licensePlate: driver.vehicle.plateNumber,
      vin: driver.vehicle.id.substring(0, 17).toUpperCase(),
      status: driver.vehicle.currentStatus,
      fuelType: driver.vehicle.type === 'MOTORCYCLE' ? 'GASOLINE' : 'DIESEL',
      fuelLevel,
      odometer: Math.floor(Math.random() * 100000),
      lastMaintenanceDate: driver.vehicle.lastMaintenance || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextMaintenanceDate: driver.vehicle.nextMaintenance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceRecords,
      issues,
      insurance: {
        provider: "SafeDrive Insurance",
        policyNumber: `POL-${driver.vehicle.id.substring(0, 6)}`,
        coverage: "Comprehensive",
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  async getVehicleMaintenanceRecords(vehicleId: string) {
    // This would be a real query to a maintenance_records table
    // For now, we'll return mock data
    return [
      {
        id: "maint-1",
        type: "OIL_CHANGE",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 42500,
        description: "Regular oil change and filter replacement",
        cost: 89.99,
        status: "COMPLETED"
      },
      {
        id: "maint-2",
        type: "TIRE_ROTATION",
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 40000,
        description: "Rotation of all tires and pressure check",
        cost: 45.00,
        status: "COMPLETED"
      },
      {
        id: "maint-3",
        type: "BRAKE_SERVICE",
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 38000,
        description: "Replacement of front brake pads",
        cost: 220.50,
        status: "COMPLETED"
      }
    ];
  }

  async getVehicleIssues(vehicleId: string) {
    // This would be a real query to a vehicle_issues table
    // For now, we'll return mock data
    return [
      {
        id: "issue-1",
        title: "Check Engine Light On",
        description: "The check engine light came on while driving on the highway. No noticeable performance issues.",
        reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
        priority: "MEDIUM"
      }
    ];
  }

  async reportVehicleIssue(vehicleId: string, issueData: ReportVehicleIssueDto) {
    // This would create a real entry in a vehicle_issues table
    // For now, we'll return a mock response
    const newIssue = {
      id: `issue-${Date.now()}`,
      vehicleId,
      title: issueData.title,
      description: issueData.description,
      reportedAt: new Date().toISOString(),
      status: "PENDING",
      priority: issueData.priority
    };

    // If the issue is high priority, update vehicle status
    if (issueData.priority === 'HIGH') {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentStatus: VehicleStatus.MAINTENANCE }
      });
    }

    return newIssue;
  }
} 