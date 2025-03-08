/*
  Warnings:

  - The values [READY,CANCELLED] on the enum `BatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [LOCAL_DELIVERY] on the enum `BatchType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CANCELLED] on the enum `RouteStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `distance` on the `DeliveryRoute` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `DeliveryRoute` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTime` on the `DeliveryRoute` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `DeliveryRoute` table. All the data in the column will be lost.
  - You are about to drop the column `toAddress` on the `DeliveryRoute` table. All the data in the column will be lost.
  - You are about to drop the column `toCity` on the `DeliveryRoute` table. All the data in the column will be lost.
  - You are about to drop the column `toGovernorate` on the `DeliveryRoute` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[batchId]` on the table `DeliveryRoute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `batchId` to the `DeliveryRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedDuration` to the `DeliveryRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDistance` to the `DeliveryRoute` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BatchStatus_new" AS ENUM ('COLLECTING', 'PROCESSING', 'COMPLETED');
ALTER TABLE "Batch" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Batch" ALTER COLUMN "status" TYPE "BatchStatus_new" USING ("status"::text::"BatchStatus_new");
ALTER TYPE "BatchStatus" RENAME TO "BatchStatus_old";
ALTER TYPE "BatchStatus_new" RENAME TO "BatchStatus";
DROP TYPE "BatchStatus_old";
ALTER TABLE "Batch" ALTER COLUMN "status" SET DEFAULT 'COLLECTING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BatchType_new" AS ENUM ('LOCAL_PICKUP', 'LOCAL_SELLERS_WAREHOUSE', 'LOCAL_WAREHOUSE_BUYERS', 'INTERCITY');
ALTER TABLE "Batch" ALTER COLUMN "type" TYPE "BatchType_new" USING ("type"::text::"BatchType_new");
ALTER TYPE "BatchType" RENAME TO "BatchType_old";
ALTER TYPE "BatchType_new" RENAME TO "BatchType";
DROP TYPE "BatchType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RouteStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
ALTER TABLE "DeliveryRoute" ALTER COLUMN "status" TYPE "RouteStatus_new" USING ("status"::text::"RouteStatus_new");
ALTER TYPE "RouteStatus" RENAME TO "RouteStatus_old";
ALTER TYPE "RouteStatus_new" RENAME TO "RouteStatus";
DROP TYPE "RouteStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_routeId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryRoute" DROP CONSTRAINT "DeliveryRoute_fromWarehouseId_fkey";

-- AlterTable
ALTER TABLE "DeliveryRoute" DROP COLUMN "distance",
DROP COLUMN "endTime",
DROP COLUMN "estimatedTime",
DROP COLUMN "startTime",
DROP COLUMN "toAddress",
DROP COLUMN "toCity",
DROP COLUMN "toGovernorate",
ADD COLUMN     "batchId" TEXT NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDuration" INTEGER NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "toWarehouseId" TEXT,
ADD COLUMN     "totalDistance" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "fromWarehouseId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "orderId" TEXT,
    "warehouseId" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isPickup" BOOLEAN NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRoute_batchId_key" ON "DeliveryRoute"("batchId");

-- AddForeignKey
ALTER TABLE "DeliveryRoute" ADD CONSTRAINT "DeliveryRoute_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRoute" ADD CONSTRAINT "DeliveryRoute_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRoute" ADD CONSTRAINT "DeliveryRoute_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "DeliveryRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
