import { PrismaClient, DeliveryRoute, RouteStatus } from '@prisma/client';

export const createTestDeliveryRoute = async (
  prisma: PrismaClient,
  data: Partial<DeliveryRoute> = {}
): Promise<DeliveryRoute> => {
  return prisma.deliveryRoute.create({
    data: {
      batchId: data.batchId || `test-batch-${Date.now()}`,
      estimatedDuration: data.estimatedDuration ?? 60,
      totalDistance: data.totalDistance ?? 10,
      status: data.status || RouteStatus.PENDING,
      // Optionally add driverId, fromWarehouseId, toWarehouseId, startedAt, completedAt
      ...data,
    },
  });
};

export const createTestUser = async (
  prisma: PrismaClient,
  data: any = {}
) => {
  return prisma.user.create({
    data: {
      email: data.email || `test${Date.now()}@example.com`,
      password: data.password || 'password123',
      firstName: data.firstName || 'Test',
      lastName: data.lastName || 'User',
      role: data.role || 'DRIVER',
      ...data,
    },
  });
};

export const createTestWarehouse = async (
  prisma: PrismaClient,
  data: any = {}
) => {
  return prisma.warehouse.create({
    data: {
      name: data.name || 'Test Warehouse',
      location: data.location || 'Test Location',
      capacity: data.capacity || 1000,
      status: data.status || 'ACTIVE',
      ...data,
    },
  });
};

export const cleanupTestData = async (prisma: PrismaClient) => {
  // Delete in order to respect foreign key constraints
  await prisma.routeStop.deleteMany();
  await prisma.deliveryRoute.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
}; 