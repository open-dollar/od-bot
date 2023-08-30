import { defaultAbiCoder } from "@ethersproject/abi";

import { initGeb } from "./geb";
import {
  multiplyWad,
  formatDataNumber,
  transformToWadPercentage,
  transformToEightHourlyRate,
  transformToAnnualRate,
  multiplyRates,
  readMany,
  getExplorerBaseUrlFromName,
} from "./common";
import { sendAlert } from "../discord/alert";
import prisma from "../prisma";
import { fetchAnalyticsData } from "@usekeyp/od-sdk/lib/virtual/virtualAnalyticsData";
import {
  CollateralAuctionsData,
  fetchCollateralAuctionData,
} from "@usekeyp/od-sdk/lib/virtual/virtualCollateralAuctionData";
import { fetchAuctionData } from "@usekeyp/od-sdk/lib/virtual/virtualAuctionData";

const saveStats = async ({ network, stats }) => {
  try {
    await prisma.globalStats.create({
      data: {
        network,
        blockTimestamp: stats.blockTimestamp,
        redemptionRate: stats.redemptionRate?.toString(),
        redemptionPrice: stats.lastRedemptionPrice?.toString(),
        erc20Supply: stats.erc20Supply?.toString(),
        globalDebt: stats.globalDebt?.toString(),
        globalDebtCeiling: stats.globalDebtCeiling?.toString(),
        globalDebtUtilization: stats.globalDebtUtilization?.toString(),
        surplusInTreasury: stats.surplusInTreasury?.toString(),
        marketPrice: stats.marketPrice?.toString(),
        redemptionRate: stats.redemptionRate?.toString(),
        redemptionPrice: stats.redemptionPrice?.toString(),
        annualRate: stats.annualRate?.toString(),
        eightRate: stats.eightRate?.toString(),
        pRate: stats.pRate?.toString(),
        iRate: stats.iRate?.toString(),
        lastUpdateTime: stats.lastUpdateTime,
      },
    });

    if (stats.tokenAnalyticsData) {
      stats.tokenAnalyticsData.map(async (token) => {
        await prisma.tokenStats.create({
          data: {
            network,
            blockTimestamp: stats.blockTimestamp,
            symbol: token.symbol,
            address: token.address,
            delayedOracle: token.delayedOracle?.toString(),
            debtAmount: token.debtAmount?.toString(),
            debtCeiling: token.debtCeiling?.toString(),
            lockedAmount: token.lockedAmount?.toString(),
            currentPrice: token.currentPrice?.toString(),
            nextPrice: token.nextPrice?.toString(),
            stabilityFee: token.stabilityFee?.toString(),
          },
        });
      });
    }
  } catch (e) {
    await sendAlert({
      embed: {
        color: 15548997,
        title: `📡 Database update 🚫 FAILED | ${network}`,
        description: `updateStats() failed with error: ${e} `,
        footer: { text: new Date().toString() },
      },
      channelName: "warning",
    });
  }
};

export const getStats = async (network) => {
  // Get raw data using virtualAnalytcisData contract
  const geb = initGeb(network);
  const analyticsData = await fetchAnalyticsData(geb);
  // Parse to human read-able
  const parsed = {
    erc20Supply: formatDataNumber(analyticsData.erc20Supply, 18, 0, true),
    globalDebt: formatDataNumber(analyticsData.globalDebt, 18, 0, true),
    globalDebtCeiling: formatDataNumber(
      analyticsData.globalDebtCeiling,
      18,
      0,
      true
    ),
    globalDebtUtilization: transformToWadPercentage(
      analyticsData.globalDebt,
      analyticsData.globalDebtCeiling
    ),
    surplusInTreasury: formatDataNumber(
      analyticsData.surplusInTreasury,
      18,
      0,
      true
    ),
    marketPrice: formatDataNumber(analyticsData.marketPrice, 18, 3, true),
    redemptionPrice: formatDataNumber(
      analyticsData.redemptionPrice,
      18,
      3,
      true
    ),
    annualRate: transformToAnnualRate(analyticsData.redemptionRate, 27),
    eightRate: transformToEightHourlyRate(analyticsData.redemptionRate, 27),
    pRate: transformToAnnualRate(analyticsData.redemptionRatePTerm, 27),
    iRate: transformToAnnualRate(analyticsData.redemptionRateITerm, 27),
  };
  parsed.tokenAnalyticsData = Object.entries(
    analyticsData.tokenAnalyticsData
  ).map(([key, value], index) => ({
    symbol: key, // Symbol
    address: geb.tokenList[key].address,
    delayedOracle: value?.delayedOracle,
    currentPrice: formatDataNumber(
      value?.currentPrice?.toString() || "0",
      18,
      2,
      true
    ),
    nextPrice: formatDataNumber(
      value?.nextPrice?.toString() || "0",
      18,
      2,
      true
    ), // Next price
    stabilityFee: transformToAnnualRate(
      value?.stabilityFee?.toString() || "0",
      27
    ), // Stability fee
    borrowRate: transformToAnnualRate(
      multiplyRates(
        value?.stabilityFee?.toString(),
        analyticsData.redemptionRate?.toString()
      ) || "0",
      27
    ), // Borrow rate
    debt: formatDataNumber(
      value?.debtAmount?.toString() || "0",
      18,
      2,
      true,
      true
    ), // Debt Amount
    debtUtilization: transformToWadPercentage(
      value?.debtAmount?.toString(),
      value?.debtCeiling?.toString()
    ), // Debt Utilization
    locked: formatDataNumber(
      value?.lockedAmount?.toString() || "0",
      18,
      2,
      false,
      true
    ), // Amount locked
    lockedUSD: formatDataNumber(
      multiplyWad(
        value?.lockedAmount?.toString(),
        value?.currentPrice?.toString()
      ) || "0",
      18,
      2,
      true,
      true
    ), // Amount locked in USD
    debtUtilizationRatio: transformToWadPercentage(
      multiplyWad(
        value?.debtAmount?.toString(),
        analyticsData?.redemptionPrice?.toString()
      ),
      multiplyWad(
        value?.lockedAmount?.toString(),
        value?.currentPrice?.toString()
      )
    ), // Debt amount / locked amount in USD
  }));

  await alertGlobalAnalyticsData(parsed, network);
  await alertTokenAnalyticsData(parsed.tokenAnalyticsData, network);

  const blockTimestamp = (await geb.provider.getBlock()).timestamp;

  const data = {
    raw: analyticsData,
    blockTimestamp: blockTimestamp.toString(),
    ...parsed,
  };
  data.save = () => saveStats({ network, stats: data });
  return data;
};

// Simple method for ready some protocol stats
export const getStatsOld = async (network) => {
  const geb = initGeb(network);
  const { oracleRelayer } = geb.contracts;

  let stats;
  stats = await readMany(
    [
      "lastRedemptionPrice",
      "marketPrice",
      "redemptionRate",
      "redemptionPriceUpdateTime",
    ],
    oracleRelayer
  );
  stats.lastUpdateTime = new Date(stats.lastUpdateTime.toNumber() * 1000);

  stats.redemptionRateUpperBound =
    await oracleRelayer.redemptionRateUpperBound();
  stats.redemptionRateLowerBound =
    await oracleRelayer.redemptionRateLowerBound();

  stats.blockTimestamp = (await geb.provider.getBlock()).timestamp;

  return stats;
};

const alertGlobalAnalyticsData = async (data, network) => {
  const fields = Object.entries(data)
    .filter(([key]) => key !== "tokenAnalyticsData")
    .map(([key, value]) => ({
      name: key,
      value: value.toString(),
      inline: true,
    }))
    .slice(0, 24); // 25 item limit

  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `📊  Analytics - Global | ${network}`,
      footer: { text: new Date().toString() },
      fields,
    },
    channelName: "action",
  });
};

const alertTokenAnalyticsData = async (tokenAnalyticsData, network) => {
  Object.entries(tokenAnalyticsData).map(async ([key, value]) => {
    let collateralFields = [];
    const data = {
      currentPrice: value.currentPrice,
      stabilityFee: value.stabilityFee,
      borrowRate: value.borrowRate,
      debt: value.debt,
      lockedUSD: value.lockedUSD,
    };
    Object.entries(data).map(([key, val]) => {
      collateralFields.push({
        name: key,
        value: val,
        inline: true,
      });
    });
    collateralFields.push({
      name: "contract",
      value: `${getExplorerBaseUrlFromName(network)}address/${value.address}`,
    });
    await sendAlert({
      embed: {
        color: 0xffffd0,
        title: `📊  Analytics - ${value.symbol} | ${network}`,
        footer: { text: new Date().toString() },
        fields: collateralFields.slice(0, 24), // 25 item limit
      },
      channelName: "action",
    });
  });
};

export const getAuctionData = async (network) => {
  const geb = initGeb(network);

  const collateralAuctionData = await fetchCollateralAuctionData(
    geb,
    "WETH",
    [1, 2, 3, 4]
  );
  // console.log(collateralAuctionData)

  const auctionData = await fetchAuctionData(
    geb,
    "0xC295763Eed507d4A0f8B77241c03dd3354781a15"
  );
  console.log(auctionData);
  console.log(auctionData.length);
};
