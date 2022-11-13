/*
  Warnings:

  - Added the required column `level` to the `RaidHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RaidHistory" ADD COLUMN     "level" INTEGER NOT NULL;
