/*
  Warnings:

  - You are about to drop the column `address` on the `Customers` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Customers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Customers` table. All the data in the column will be lost.
  - Added the required column `first_surname` to the `Customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `second_surname` to the `Customers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Customers_email_key";

-- AlterTable
ALTER TABLE "Customers" DROP COLUMN "address",
DROP COLUMN "email",
DROP COLUMN "phone",
ADD COLUMN     "first_surname" TEXT NOT NULL,
ADD COLUMN     "second_surname" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Sales_id_customer_idx" ON "Sales"("id_customer");
