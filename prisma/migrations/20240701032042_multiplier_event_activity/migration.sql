/*
  Warnings:

  - You are about to drop the column `extraData` on the `MultiplierEvent` table. All the data in the column will be lost.
  - Added the required column `activity` to the `MultiplierEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MultiplierEventActivity" AS ENUM ('REMOVED', 'ADDED');

-- AlterTable
ALTER TABLE "MultiplierEvent" DROP COLUMN "extraData",
ADD COLUMN     "activity" "MultiplierEventActivity" NOT NULL;
