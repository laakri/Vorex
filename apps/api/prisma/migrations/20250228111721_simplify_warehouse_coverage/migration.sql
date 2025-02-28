/*
  Warnings:

  - You are about to drop the column `zone` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `coverageRadius` on the `Warehouse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "zone";

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "coverageRadius",
ADD COLUMN     "coverageGovernorate" TEXT[];
