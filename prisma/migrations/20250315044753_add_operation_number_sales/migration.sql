/*
  Warnings:

  - A unique constraint covering the columns `[operation_number]` on the table `Sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "operation_number" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Sales_operation_number_key" ON "Sales"("operation_number");
