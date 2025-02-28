/*
  Warnings:

  - The values [LOCAL] on the enum `BatchType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PROCESSING,READY_FOR_PICKUP] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `vehicleType` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BatchType_new" AS ENUM ('LOCAL_PICKUP', 'LOCAL_DELIVERY', 'INTERCITY');
ALTER TABLE "Batch" ALTER COLUMN "type" TYPE "BatchType_new" USING ("type"::text::"BatchType_new");
ALTER TYPE "BatchType" RENAME TO "BatchType_old";
ALTER TYPE "BatchType_new" RENAME TO "BatchType";
DROP TYPE "BatchType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'ASSIGNED_TO_BATCH', 'PICKUP_COMPLETE', 'IN_TRANSIT', 'AT_DESTINATION_WH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "vehicleType" "VehicleType" NOT NULL;
