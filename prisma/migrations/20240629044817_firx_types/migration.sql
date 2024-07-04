/*
  Warnings:

  - The values [DEBT_BORRROW] on the enum `BoltCampaign` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `multiplier` on the `UserMultiplier` table. All the data in the column will be lost.
  - Added the required column `amount` to the `UserMultiplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BoltCampaign_new" AS ENUM ('COLLATERAL_DEPOSIT', 'DEBT_BORROW', 'GALXE', 'ZEALY', 'ODG_ETH_LP', 'OD_ETH_LP');
ALTER TABLE "UserCampaign" ALTER COLUMN "type" TYPE "BoltCampaign_new" USING ("type"::text::"BoltCampaign_new");
ALTER TABLE "CampaignEvent" ALTER COLUMN "type" TYPE "BoltCampaign_new" USING ("type"::text::"BoltCampaign_new");
ALTER TYPE "BoltCampaign" RENAME TO "BoltCampaign_old";
ALTER TYPE "BoltCampaign_new" RENAME TO "BoltCampaign";
DROP TYPE "BoltCampaign_old";
COMMIT;

-- AlterEnum
ALTER TYPE "Multiplier" ADD VALUE 'ETH_TVL_20K';

-- AlterTable
ALTER TABLE "UserMultiplier" DROP COLUMN "multiplier",
ADD COLUMN     "amount" INTEGER NOT NULL;
