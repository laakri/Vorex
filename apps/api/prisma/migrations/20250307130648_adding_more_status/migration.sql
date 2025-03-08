-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'CITY_ASSIGNED_TO_PICKUP_ACCEPTED';
ALTER TYPE "OrderStatus" ADD VALUE 'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED';
ALTER TYPE "OrderStatus" ADD VALUE 'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED';
