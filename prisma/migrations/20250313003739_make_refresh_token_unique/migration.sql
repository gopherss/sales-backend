/*
  Warnings:

  - A unique constraint covering the columns `[refreshToken]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Users_refreshToken_key" ON "Users"("refreshToken");
