/*
  Warnings:

  - Added the required column `type` to the `UserMultiplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "multiplier" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "UserMultiplier" ADD COLUMN     "type" "Multiplier" NOT NULL;
