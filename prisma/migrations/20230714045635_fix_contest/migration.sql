/*
  Warnings:

  - Added the required column `duration` to the `Contest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "duration" INT4 NOT NULL;
