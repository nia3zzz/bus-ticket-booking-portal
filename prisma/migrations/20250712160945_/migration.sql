/*
  Warnings:

  - Changed the type of `seatNumbers` on the `BookedSeat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "BookedSeat" DROP COLUMN "seatNumbers",
ADD COLUMN     "seatNumbers" JSONB NOT NULL;
