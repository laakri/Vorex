/*
  Warnings:

  - The values [CITY_IN_TRANSIT_TO_WAREHOUSE,CITY_ASSIGNED_TO_PICKUP_ACCEPTED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'LOCAL_ASSIGNED_TO_PICKUP', 'LOCAL_PICKED_UP', 'LOCAL_DELIVERED', 'CITY_ASSIGNED_TO_PICKUP', 'CITY_PICKED_UP', 'CITY_ARRIVED_AT_SOURCE_WAREHOUSE', 'CITY_READY_FOR_INTERCITY_TRANSFER', 'CITY_READY_FOR_INTERCITY_TRANSFER_BATCHED', 'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE', 'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE', 'CITY_READY_FOR_LOCAL_DELIVERY', 'CITY_READY_FOR_LOCAL_DELIVERY_BATCHED', 'CITY_DELIVERED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
