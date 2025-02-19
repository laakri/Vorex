-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerifiedAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerifiedWarehouse" BOOLEAN NOT NULL DEFAULT false;
