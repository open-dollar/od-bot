/*
  Warnings:

  - You are about to drop the `stats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "stats";

-- CreateTable
CREATE TABLE "globalStats" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "network" "Network" NOT NULL,
    "blockTimestamp" INTEGER NOT NULL,
    "redemptionRate" TEXT NOT NULL,
    "redemptionPrice" TEXT NOT NULL,
    "lastUpdateTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "globalStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokenStats" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "network" "Network" NOT NULL,
    "blockTimestamp" INTEGER NOT NULL,

    CONSTRAINT "tokenStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "globalStats_network_blockTimestamp_key" ON "globalStats"("network", "blockTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "tokenStats_network_blockTimestamp_key" ON "tokenStats"("network", "blockTimestamp");
