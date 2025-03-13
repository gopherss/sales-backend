/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the column `id_category_product` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `SaleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `tax_id` on the `Suppliers` table. All the data in the column will be lost.
  - You are about to drop the `ProductCategory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ruc]` on the table `Suppliers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_category` to the `Products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruc` to the `Suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_id_category_product_fkey";

-- DropIndex
DROP INDEX "Suppliers_tax_id_key";

-- AlterTable
ALTER TABLE "Products" DROP COLUMN "createdBy",
DROP COLUMN "expiration_date",
DROP COLUMN "id_category_product",
DROP COLUMN "stock",
ADD COLUMN     "id_category" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SaleDetails" DROP COLUMN "subtotal";

-- AlterTable
ALTER TABLE "Suppliers" DROP COLUMN "tax_id",
ADD COLUMN     "ruc" TEXT NOT NULL;

-- DropTable
DROP TABLE "ProductCategory";

-- CreateTable
CREATE TABLE "Categories" (
    "id_category" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id_category")
);

-- CreateTable
CREATE TABLE "StockMovements" (
    "id_movement" SERIAL NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "movement_type" TEXT NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovements_pkey" PRIMARY KEY ("id_movement")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_key" ON "Categories"("name");

-- CreateIndex
CREATE INDEX "Categories_name_idx" ON "Categories"("name");

-- CreateIndex
CREATE INDEX "StockMovements_id_product_idx" ON "StockMovements"("id_product");

-- CreateIndex
CREATE UNIQUE INDEX "Suppliers_ruc_key" ON "Suppliers"("ruc");

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "Categories"("id_category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovements" ADD CONSTRAINT "StockMovements_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "Products"("id_product") ON DELETE RESTRICT ON UPDATE CASCADE;
