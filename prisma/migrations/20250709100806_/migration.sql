/*
  Warnings:

  - You are about to drop the column `seatNumber` on the `BookedSeat` table. All the data in the column will be lost.
  - You are about to drop the column `totalSeats` on the `Bus` table. All the data in the column will be lost.
  - Added the required column `class` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `farePerTicket` to the `Bus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seats` to the `Bus` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TripStatusTypes" AS ENUM ('UNTRACKED', 'PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BusClassTypes" AS ENUM ('ECONOMY', 'BUSINESS', 'FIRSTCLASS');

-- AlterTable
ALTER TABLE "BookedSeat" DROP COLUMN "seatNumber",
ADD COLUMN     "seatNumbers" TEXT[];

-- AlterTable
ALTER TABLE "Bus" DROP COLUMN "totalSeats",
ADD COLUMN     "class" "BusClassTypes" NOT NULL,
ADD COLUMN     "farePerTicket" INTEGER NOT NULL,
ADD COLUMN     "seats" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "status" "TripStatusTypes" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
