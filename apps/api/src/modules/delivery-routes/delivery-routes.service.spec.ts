import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryRoutesService } from './delivery-routes.service';
import { PrismaService } from 'prisma/prisma.service';
import { DriverEarningsService } from '../drivers/driver-earnings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createTestDeliveryRoute, createTestUser, createTestWarehouse, cleanupTestData } from '../../../test/helpers';
import { RouteStatus, BatchStatus } from '@prisma/client';

describe('DeliveryRoutesService', () => {
  let service: DeliveryRoutesService;
  let prisma: PrismaService;
  let driverEarningsService: DriverEarningsService;
  let notificationsService: NotificationsService;

  const mockDriverEarningsService = {
    calculateAndCreateEarnings: jest.fn(),
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryRoutesService,
        PrismaService,
        {
          provide: DriverEarningsService,
          useValue: mockDriverEarningsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<DeliveryRoutesService>(DeliveryRoutesService);
    prisma = module.get<PrismaService>(PrismaService);
    driverEarningsService = module.get<DriverEarningsService>(DriverEarningsService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  beforeEach(async () => {
    await cleanupTestData(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  describe('getRouteById', () => {
    it('should return a route when it exists', async () => {
      const testRoute = await createTestDeliveryRoute(prisma);

      const route = await service.getRouteById(testRoute.id);

      expect(route).toBeDefined();
      expect(route.id).toBe(testRoute.id);
    });

    it('should throw an error if route not found', async () => {
      await expect(service.getRouteById('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getRoutesByDriver', () => {
    it('should return routes for a specific driver', async () => {
      const testDriver = await createTestUser(prisma, { role: 'DRIVER' });
      const testRoute = await createTestDeliveryRoute(prisma);
      
      // Update route with driver
      await prisma.deliveryRoute.update({
        where: { id: testRoute.id },
        data: { driverId: testDriver.id }
      });

      const routes = await service.getRoutesByDriver(testDriver.id);

      expect(routes).toBeDefined();
      expect(routes.length).toBe(1);
      expect(routes[0].driverId).toBe(testDriver.id);
    });

    it('should return empty array when driver has no routes', async () => {
      const testDriver = await createTestUser(prisma, { role: 'DRIVER' });
      const routes = await service.getRoutesByDriver(testDriver.id);
      expect(routes).toEqual([]);
    });
  });

  describe('assignDriverToRoute', () => {
    it('should assign a driver to a route', async () => {
      const testRoute = await createTestDeliveryRoute(prisma);
      const testDriver = await createTestUser(prisma, { role: 'DRIVER' });

      const updatedRoute = await service.assignDriverToRoute(testRoute.id, { driverId: testDriver.id });

      expect(updatedRoute).toBeDefined();
      expect(updatedRoute.driverId).toBe(testDriver.id);
      expect(updatedRoute.status).toBe(RouteStatus.IN_PROGRESS);
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });

    it('should throw an error if driver not found', async () => {
      const testRoute = await createTestDeliveryRoute(prisma);
      await expect(service.assignDriverToRoute(testRoute.id, { driverId: 'non-existent-driver' })).rejects.toThrow();
    });
  });

  describe('updateRouteStatus', () => {
    it('should update route status', async () => {
      const testRoute = await createTestDeliveryRoute(prisma);

      const updatedRoute = await service.updateRouteStatus(testRoute.id, RouteStatus.IN_PROGRESS);

      expect(updatedRoute).toBeDefined();
      expect(updatedRoute.status).toBe(RouteStatus.IN_PROGRESS);
    });

    it('should throw an error if route not found', async () => {
      await expect(service.updateRouteStatus('non-existent-id', RouteStatus.IN_PROGRESS)).rejects.toThrow();
    });
  });

  describe('updateRouteStop', () => {
    it('should update a route stop', async () => {
      const testRoute = await createTestDeliveryRoute(prisma);
      const testStop = await prisma.routeStop.create({
        data: {
          routeId: testRoute.id,
          address: 'Test Address',
          latitude: 0,
          longitude: 0,
          isPickup: true,
          sequenceOrder: 1
        }
      });

      const updatedStop = await service.updateRouteStop(testStop.id, { isCompleted: true });

      expect(updatedStop).toBeDefined();
      expect(updatedStop.isCompleted).toBe(true);
      expect(updatedStop.completedAt).toBeDefined();
    });

    it('should throw an error if stop not found', async () => {
      await expect(service.updateRouteStop('non-existent-id', { isCompleted: true })).rejects.toThrow();
    });
  });

  describe('getAvailableRoutes', () => {
    it('should return available routes', async () => {
      await createTestDeliveryRoute(prisma);
      await createTestDeliveryRoute(prisma);

      const routes = await service.getAvailableRoutes();

      expect(routes).toBeDefined();
      expect(routes.length).toBe(2);
    });

    it('should return empty array when no routes are available', async () => {
      const routes = await service.getAvailableRoutes();
      expect(routes).toEqual([]);
    });
  });

  describe('getDriverActiveRoute', () => {
    it('should return active route for driver', async () => {
      const testDriver = await createTestUser(prisma, { role: 'DRIVER' });
      const testRoute = await createTestDeliveryRoute(prisma);
      
      await prisma.deliveryRoute.update({
        where: { id: testRoute.id },
        data: { 
          driverId: testDriver.id,
          status: RouteStatus.IN_PROGRESS
        }
      });

      const route = await service.getDriverActiveRoute(testDriver.id);

      expect(route).not.toBeNull();
      expect(route?.driverId).toBe(testDriver.id);
      expect(route?.status).toBe(RouteStatus.IN_PROGRESS);
    });

    it('should return null when driver has no active route', async () => {
      const testDriver = await createTestUser(prisma, { role: 'DRIVER' });
      const route = await service.getDriverActiveRoute(testDriver.id);
      expect(route).toBeNull();
    });
  });
}); 