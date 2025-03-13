/*
  Warnings:

  - Added the required column `id_customer` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "id_customer" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Customers" (
    "id_customer" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customers_pkey" PRIMARY KEY ("id_customer")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customers_email_key" ON "Customers"("email");

-- CreateIndex
CREATE INDEX "Customers_name_idx" ON "Customers"("name");

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "Customers"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;
