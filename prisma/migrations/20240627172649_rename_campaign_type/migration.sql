/*
  Warnings:

  - You are about to drop the column `campaignType` on the `UserCampaign` table. All the data in the column will be lost.
  - Added the required column `type` to the `UserCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserCampaign" DROP COLUMN "campaignType",
ADD COLUMN     "type" "BoltCampaign" NOT NULL;
