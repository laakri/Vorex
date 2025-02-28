-- DropForeignKey
ALTER TABLE "DeliveryRoute" DROP CONSTRAINT "DeliveryRoute_driverId_fkey";

-- AlterTable
ALTER TABLE "DeliveryRoute" ALTER COLUMN "driverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DeliveryRoute" ADD CONSTRAINT "DeliveryRoute_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
