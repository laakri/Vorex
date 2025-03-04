/*
  Warnings:

  - The values [ASSIGNED_TO_BATCH,PICKUP_COMPLETE,IN_TRANSIT,AT_DESTINATION_WH,OUT_FOR_DELIVERY,DELIVERED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Delivery` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'LOCAL_ASSIGNED_TO_PICKUP', 'LOCAL_PICKED_UP', 'LOCAL_DELIVERED', 'CITY_ASSIGNED_TO_PICKUP', 'CITY_PICKED_UP', 'CITY_IN_TRANSIT_TO_WAREHOUSE', 'CITY_ARRIVED_AT_SOURCE_WAREHOUSE', 'CITY_READY_FOR_INTERCITY_TRANSFER', 'CITY_IN_TRANSIT_TO_DESTINATION_WAREHOUSE', 'CITY_ARRIVED_AT_DESTINATION_WAREHOUSE', 'CITY_READY_FOR_LOCAL_DELIVERY', 'CITY_DELIVERED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_routeId_fkey";

-- DropTable
DROP TABLE "Delivery";

-- DropEnum
DROP TYPE "DeliveryStatus";
