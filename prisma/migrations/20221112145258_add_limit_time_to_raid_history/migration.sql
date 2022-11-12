/*
  Warnings:

  - Added the required column `limitTime` to the `RaidHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RaidHistory" ADD COLUMN     "limitTime" TEXT NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;
