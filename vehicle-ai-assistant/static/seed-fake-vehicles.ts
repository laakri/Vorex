import { PrismaClient } from '@prisma/client';
// @ts-ignore
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding fake vehicle with detailed data...');
  
  // Clean up existing data
  await prisma.vehicleIssue.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.insuranceInfo.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  
  // Create a user for the driver
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      fullName: 'Ahmed Mohamed',
      email: 'ahmed.driver@example.com',
      password: hashedPassword,
      role: ['DRIVER'],
      isVerifiedDriver: true,
      isEmailVerified: true
    }
  });
  
  console.log('Created driver user');
  
  // Create vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: 'TUN-5432',
      type: 'VAN',
      make: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2019,
      capacity: 1350.0,
      maxWeight: 2500.0,
      currentStatus: 'ACTIVE',
      lastMaintenance: new Date('2023-05-15'),
      nextMaintenance: new Date('2023-11-15'),
      odometer: 67432,
      
      // Create insurance info
      insuranceInfo: {
        create: {
          provider: 'SafeGuard Insurance',
          policyNumber: 'POL-78923-VH',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          coverage: 'Full coverage with roadside assistance'
        }
      },
      
      // Create maintenance records
      maintenanceRecords: {
        createMany: {
          data: [
            {
              type: 'Oil Change',
              date: new Date('2023-05-15'),
              odometer: 62000,
              description: 'Regular oil change with filter replacement',
              cost: 120.50,
              status: 'COMPLETED'
            },
            {
              type: 'Brake Service',
              date: new Date('2023-03-22'),
              odometer: 58000,
              description: 'Front brake pads replacement and rotor inspection',
              cost: 350.00,
              status: 'COMPLETED'
            },
            {
              type: 'Transmission Service',
              date: new Date('2023-01-10'),
              odometer: 52000,
              description: 'Transmission fluid flush and filter change',
              cost: 280.75,
              status: 'COMPLETED'
            },
            {
              type: 'Tire Rotation',
              date: new Date('2023-04-05'),
              odometer: 60000,
              description: 'Tire rotation and pressure check',
              cost: 45.00,
              status: 'COMPLETED'
            },
            {
              type: 'Annual Inspection',
              date: new Date('2023-11-20'),
              odometer: 70000,
              description: 'Scheduled annual inspection and maintenance',
              cost: 500.00,
              status: 'SCHEDULED'
            }
          ]
        }
      },
      
      // Create vehicle issues
      issues: {
        createMany: {
          data: [
            {
              title: 'Check Engine Light',
              description: 'Check engine light comes on intermittently during highway driving',
              reportedAt: new Date('2023-06-10'),
              status: 'PENDING',
              priority: 'MEDIUM'
            },
            {
              title: 'Air Conditioning',
              description: 'AC not cooling properly on hot days',
              reportedAt: new Date('2023-05-28'),
              status: 'IN_PROGRESS',
              priority: 'LOW'
            },
            {
              title: 'Door Lock Malfunction',
              description: 'Rear left door sometimes fails to lock electronically',
              reportedAt: new Date('2023-04-17'),
              status: 'RESOLVED',
              priority: 'HIGH'
            }
          ]
        }
      }
    }
  });
  
  console.log('Created vehicle with maintenance records and issues');
  
  // Create driver with link to vehicle
  const driver = await prisma.driver.create({
    data: {
      userId: user.id,
      licenseNumber: 'DL-7852369',
      licenseType: 'C',
      licenseExpiry: new Date('2025-08-15'),
      vehicleId: vehicle.id,
      address: '123 Transport Avenue',
      city: 'Tunis',
      postalCode: '1000',
      governorate: 'Tunis',
      phone: '+216 98 765 4321',
      emergencyContact: '+216 23 456 7890',
      rating: 4.8,
      totalDeliveries: 342,
      availabilityStatus: 'ONLINE'
    }
  });
  
  console.log('Created driver and linked to vehicle');
  
  console.log('Seeding completed successfully');
  
  return { user, vehicle, driver };
}

main()
  .then((result) => {
    console.log('Vehicle ID:', result.vehicle.id);
    console.log('Driver ID:', result.driver.id);
    console.log('User ID:', result.user.id);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 