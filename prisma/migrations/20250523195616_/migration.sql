/*
  Warnings:

  - You are about to drop the column `isverified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isverified",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
