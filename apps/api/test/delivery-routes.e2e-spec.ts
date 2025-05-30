import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'prisma/prisma.service';
import { Role, RouteStatus } from '@prisma/client';

describe('DeliveryRoutesController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let driverAuthToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Create test admin user and get auth token
    const adminUser = await prismaService.user.create({
      data: {
        email: 'admin@test.com',
        password: 'hashedPassword', // In real app, this would be properly hashed
        fullName: 'Test Admin',
        role: [Role.ADMIN],
      },
    });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'hashedPassword',
      });

    authToken = adminLoginResponse.body.access_token;

    // Create test driver user and get auth token
    const driverUser = await prismaService.user.create({
      data: {
        email: 'driver@test.com',
        password: 'hashedPassword',
        fullName: 'Test Driver',
        role: [Role.DRIVER],
      },
    });

    const driver = await prismaService.driver.create({
      data: {
        userId: driverUser.id,
        licenseNumber: 'TEST123',
        licenseType: 'B',
        licenseExpiry: new Date('2025-12-31'),
        address: 'Test Address',
        city: 'Test City',
        postalCode: '12345',
        governorate: 'Test Governorate',
        phone: '1234567890',
        emergencyContact: '9876543210',
      },
    });

    const driverLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'driver@test.com',
        password: 'hashedPassword',
      });

    driverAuthToken = driverLoginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.deliveryRoute.deleteMany();
    await prismaService.driver.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('GET /delivery-routes', () => {
    it('should return available routes', async () => {
      // Create a test route
      const route = await prismaService.deliveryRoute.create({
        data: {
          status: RouteStatus.PENDING,
          totalDistance: 10,
          estimatedDuration: 60,
          batch: {
            create: {
              type: 'LOCAL_PICKUP',
              status: 'COLLECTING',
              totalWeight: 100,
              totalVolume: 50,
              orderCount: 1,
              vehicleType: 'VAN',
              warehouse: {
                create: {
                  name: 'Test Warehouse',
                  address: 'Test Address',
                  city: 'Test City',
                  governorate: 'Test Governorate',
                  postalCode: '12345',
                  phone: '1234567890',
                  capacity: 1000,
                  currentLoad: 0,
                  latitude: 0,
                  longitude: 0,
                  coverageGovernorate: ['Test Governorate'],
                },
              },
            },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/delivery-routes/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBeDefined();
    });
  });

  describe('POST /delivery-routes/:id/assign', () => {
    it('should assign a driver to a route', async () => {
      // Create a test route
      const route = await prismaService.deliveryRoute.create({
        data: {
          status: RouteStatus.PENDING,
          totalDistance: 10,
          estimatedDuration: 60,
          batch: {
            create: {
              type: 'LOCAL_PICKUP',
              status: 'COLLECTING',
              totalWeight: 100,
              totalVolume: 50,
              orderCount: 1,
              vehicleType: 'VAN',
              warehouse: {
                create: {
                  name: 'Test Warehouse',
                  address: 'Test Address',
                  city: 'Test City',
                  governorate: 'Test Governorate',
                  postalCode: '12345',
                  phone: '1234567890',
                  capacity: 1000,
                  currentLoad: 0,
                  latitude: 0,
                  longitude: 0,
                  coverageGovernorate: ['Test Governorate'],
                },
              },
            },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/delivery-routes/${route.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'driver@test.com' })
        .expect(200);

      expect(response.body.driverId).toBeDefined();
      expect(response.body.status).toBe(RouteStatus.IN_PROGRESS);
    });
  });

  describe('PATCH /delivery-routes/stops/:id', () => {
    it('should update a route stop', async () => {
      // Get the driver first
      const driver = await prismaService.driver.findFirst();
      if (!driver) {
        throw new Error('No driver found for testing');
      }

      // Create a test route with a stop
      const route = await prismaService.deliveryRoute.create({
        data: {
          status: RouteStatus.IN_PROGRESS,
          totalDistance: 10,
          estimatedDuration: 60,
          driver: {
            connect: {
              id: driver.id,
            },
          },
          stops: {
            create: {
              address: 'Test Stop',
              latitude: 0,
              longitude: 0,
              isPickup: true,
              sequenceOrder: 1,
            },
          },
          batch: {
            create: {
              type: 'LOCAL_PICKUP',
              status: 'COLLECTING',
              totalWeight: 100,
              totalVolume: 50,
              orderCount: 1,
              vehicleType: 'VAN',
              warehouse: {
                create: {
                  name: 'Test Warehouse',
                  address: 'Test Address',
                  city: 'Test City',
                  governorate: 'Test Governorate',
                  postalCode: '12345',
                  phone: '1234567890',
                  capacity: 1000,
                  currentLoad: 0,
                  latitude: 0,
                  longitude: 0,
                  coverageGovernorate: ['Test Governorate'],
                },
              },
            },
          },
        },
        include: {
          stops: true,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/delivery-routes/stops/${route.stops[0].id}`)
        .set('Authorization', `Bearer ${driverAuthToken}`)
        .send({ isCompleted: true })
        .expect(200);

      expect(response.body.isCompleted).toBe(true);
      expect(response.body.completedAt).toBeDefined();
    });
  });
}); 