import { PrismaClient } from '@prisma/client';
import type { Lifecycle } from '@jest/globals';

declare global {
  var prisma: PrismaClient;
  var beforeAll: Lifecycle;
  var afterAll: Lifecycle;
}

export const prisma = new PrismaClient();

// Global setup
beforeAll(async () => {
  // Add any global setup here
  // For example, you might want to clean the database before running tests
  await prisma.$connect();
});

// Global teardown
afterAll(async () => {
  // Add any global teardown here
  await prisma.$disconnect();
});

// Make prisma available globally for tests
global.prisma = prisma; 