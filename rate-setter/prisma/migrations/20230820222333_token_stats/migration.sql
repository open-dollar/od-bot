/*
  Warnings:

  - A unique constraint covering the columns `[network,blockTimestamp,symbol]` on the table `tokenStats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tokenStats_network_blockTimestamp_key";

-- AlterTable
ALTER TABLE "globalStats" ADD COLUMN     "annualRate" TEXT,
ADD COLUMN     "eightRate" TEXT,
ADD COLUMN     "erc20Supply" TEXT,
ADD COLUMN     "globalDebt" TEXT,
ADD COLUMN     "globalDebtCeiling" TEXT,
ADD COLUMN     "globalDebtUtilization" TEXT,
ADD COLUMN     "iRate" TEXT,
ADD COLUMN     "marketPrice" TEXT,
ADD COLUMN     "pRate" TEXT,
ADD COLUMN     "surplusInTreasury" TEXT,
ALTER COLUMN "blockTimestamp" SET DATA TYPE TEXT,
ALTER COLUMN "redemptionRate" DROP NOT NULL,
ALTER COLUMN "redemptionPrice" DROP NOT NULL,
ALTER COLUMN "lastUpdateTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tokenStats" ADD COLUMN     "address" TEXT,
ADD COLUMN     "currentPrice" TEXT,
ADD COLUMN     "debtAmount" TEXT,
ADD COLUMN     "debtCeiling" TEXT,
ADD COLUMN     "delayedOracle" TEXT,
ADD COLUMN     "lockedAmount" TEXT,
ADD COLUMN     "nextPrice" TEXT,
ADD COLUMN     "stabilityFee" TEXT,
ADD COLUMN     "symbol" TEXT,
ALTER COLUMN "blockTimestamp" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tokenStats_network_blockTimestamp_symbol_key" ON "tokenStats"("network", "blockTimestamp", "symbol");
