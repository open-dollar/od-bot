/*
  Warnings:

  - You are about to drop the column `galxePoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `zealyPoints` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BoltCampaign" AS ENUM ('COLLATERAL_DEPOSIT', 'DEBT_BORRROW', 'GALXE', 'ZEALY', 'ODG_ETH_LP', 'OD_ETH_LP');

-- CreateEnum
CREATE TYPE "Multiplier" AS ENUM ('TURTLE_CLUB', 'GENESIS_NFT', 'GENESIS_NFV', 'OG_NFT', 'CUSTOM');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "galxePoints",
DROP COLUMN "zealyPoints",
ADD COLUMN     "bolts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "multiplier" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "UserCampaign" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "campaignType" "BoltCampaign" NOT NULL,

    CONSTRAINT "UserCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMultiplier" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "multiplier" INTEGER NOT NULL,

    CONSTRAINT "UserMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "baseAmount" INTEGER NOT NULL,
    "multiplier" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "type" "BoltCampaign" NOT NULL,

    CONSTRAINT "CampaignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiplierEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "multiplier" INTEGER NOT NULL,
    "type" "Multiplier" NOT NULL,
    "extraData" TEXT,

    CONSTRAINT "MultiplierEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserCampaign" ADD CONSTRAINT "UserCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMultiplier" ADD CONSTRAINT "UserMultiplier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEvent" ADD CONSTRAINT "CampaignEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiplierEvent" ADD CONSTRAINT "MultiplierEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
