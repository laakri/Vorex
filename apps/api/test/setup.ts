import { PrismaClient } from '@prisma/client';

declare global {
  // Make prisma available globally for tests
  // eslint-disable-next-line no-var
  var prisma: PrismaClient;
}

export const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

global.prisma = prisma; 