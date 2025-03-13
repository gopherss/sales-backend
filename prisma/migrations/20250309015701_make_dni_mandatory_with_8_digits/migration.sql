/*
  Warnings:

  - You are about to alter the column `dni` on the `Customers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(8)`.
  - A unique constraint covering the columns `[dni]` on the table `Customers` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dni` on table `Customers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customers" ALTER COLUMN "dni" SET NOT NULL,
ALTER COLUMN "dni" SET DATA TYPE VARCHAR(8);

-- CreateIndex
CREATE UNIQUE INDEX "Customers_dni_key" ON "Customers"("dni");
