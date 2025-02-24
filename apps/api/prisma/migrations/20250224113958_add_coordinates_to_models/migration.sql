/*
  Warnings:

  - You are about to drop the column `isVerifiedAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isVerifiedDriver` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isVerifiedWarehouse` on the `User` table. All the data in the column will be lost.
  - Added the required column `coverageRadius` to the `Warehouse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Warehouse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dropLatitude" DOUBLE PRECISION,
ADD COLUMN     "dropLongitude" DOUBLE PRECISION,
ADD COLUMN     "isLocalDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupLatitude" DOUBLE PRECISION,
ADD COLUMN     "pickupLongitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVerifiedAdmin",
DROP COLUMN "isVerifiedDriver",
DROP COLUMN "isVerifiedWarehouse";

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "coverageRadius" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
