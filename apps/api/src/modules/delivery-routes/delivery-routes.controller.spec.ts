import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryRoutesController } from './delivery-routes.controller';
import { DeliveryRoutesService } from './delivery-routes.service';
import { PrismaService } from 'prisma/prisma.service';
import { RouteStatus } from '@prisma/client';

describe('DeliveryRoutesController', () => {
  let controller: DeliveryRoutesController;
  let service: DeliveryRoutesService;
  let prismaService: PrismaService;

  const mockDeliveryRoutesService = {
    getRouteById: jest.fn(),
    getRoutesByDriver: jest.fn(),
    getRoutesByWarehouse: jest.fn(),
    assignDriverToRoute: jest.fn(),
    updateRouteStop: jest.fn(),
    getAvailableRoutes: jest.fn(),
    getDriverActiveRoute: jest.fn(),
  };

  const mockPrismaService = {
    driver: {
      findFirst: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryRoutesController],
      providers: [
        {
          provide: DeliveryRoutesService,
          useValue: mockDeliveryRoutesService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<DeliveryRoutesController>(DeliveryRoutesController);
    service = module.get<DeliveryRoutesService>(DeliveryRoutesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRouteById', () => {
    it('should return a route by id', async () => {
      const mockRoute = {
        id: 'route-1',
        status: RouteStatus.PENDING,
      };

      mockDeliveryRoutesService.getRouteById.mockResolvedValue(mockRoute);

      const result = await controller.getRouteById('route-1');
      expect(result).toEqual(mockRoute);
      expect(service.getRouteById).toHaveBeenCalledWith('route-1');
    });
  });

  describe('getRoutes', () => {
    it('should return routes by driver id', async () => {
      const mockRoutes = [
        { id: 'route-1', driverId: 'driver-1' },
        { id: 'route-2', driverId: 'driver-1' },
      ];

      mockDeliveryRoutesService.getRoutesByDriver.mockResolvedValue(mockRoutes);

      const result = await controller.getRoutes('driver-1');
      expect(result).toEqual(mockRoutes);
      expect(service.getRoutesByDriver).toHaveBeenCalledWith('driver-1');
    });

    it('should return routes by warehouse id', async () => {
      const mockRoutes = [
        { id: 'route-1', warehouseId: 'warehouse-1' },
        { id: 'route-2', warehouseId: 'warehouse-1' },
      ];

      mockDeliveryRoutesService.getRoutesByWarehouse.mockResolvedValue(mockRoutes);

      const result = await controller.getRoutes(undefined, 'warehouse-1');
      expect(result).toEqual(mockRoutes);
      expect(service.getRoutesByWarehouse).toHaveBeenCalledWith('warehouse-1');
    });
  });

  describe('assignDriverToRoute', () => {
    it('should assign a driver to a route', async () => {
      const mockDriver = {
        id: 'driver-1',
        userId: 'user-1',
      };

      const mockRoute = {
        id: 'route-1',
        driverId: 'driver-1',
        status: RouteStatus.IN_PROGRESS,
      };

      const mockUser = {
        id: 'user-1',
        role: ['ADMIN'],
      };

      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockDeliveryRoutesService.assignDriverToRoute.mockResolvedValue(mockRoute);

      const result = await controller.assignDriverToRoute('route-1', { userId: 'user-1' }, mockUser);
      expect(result).toEqual(mockRoute);
      expect(service.assignDriverToRoute).toHaveBeenCalled();
    });
  });

  describe('updateRouteStop', () => {
    it('should update a route stop', async () => {
      const mockStop = {
        id: 'stop-1',
        isCompleted: true,
      };

      mockDeliveryRoutesService.updateRouteStop.mockResolvedValue(mockStop);

      const result = await controller.updateRouteStop('stop-1', { isCompleted: true });
      expect(result).toEqual(mockStop);
      expect(service.updateRouteStop).toHaveBeenCalledWith('stop-1', { isCompleted: true });
    });
  });
}); 