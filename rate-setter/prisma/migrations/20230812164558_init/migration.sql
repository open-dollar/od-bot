-- CreateEnum
CREATE TYPE "Network" AS ENUM ('OPTIMISM', 'OPTIMISM_GOERLI', 'ARBITRUM', 'ARBITRUM_GOERLI');

-- CreateTable
CREATE TABLE "stats" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "network" "Network" NOT NULL,
    "blockTimestamp" INTEGER NOT NULL,
    "redemptionRate" TEXT NOT NULL,
    "redemptionPrice" TEXT NOT NULL,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stats_network_blockTimestamp_key" ON "stats"("network", "blockTimestamp");
