/*
  Warnings:

  - Added the required column `journeyDate` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "journeyDate" TIMESTAMP(3) NOT NULL;
