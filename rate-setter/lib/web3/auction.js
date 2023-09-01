import { initGeb } from "./geb";

import { fetchCollateralAuctionData } from "@usekeyp/od-sdk/lib/virtual/virtualCollateralAuctionData.js";
import { fetchAuctionData } from "@usekeyp/od-sdk/lib/virtual/virtualAuctionData.js";
import { fetchLiquidationData } from "@usekeyp/od-sdk/lib/virtual/virtualLiquidationData.js";
import { sendAlert } from "../discord/alert";

export const getAuctionsForUser = async (network, userAddress) => {
  try {
    const geb = initGeb(network);
    const proxyAddress = await geb.getProxyAction(userAddress);
    const auctionData = await fetchAuctionData(geb, proxyAddress);
    console.log(auctionData);
  } catch (e) {
    console.log("fetchAuctionData failed");
  }
};

export const getDebtAuctions = async (network, startBlock) => {
  const geb = initGeb(network);
  const { auctions: debtAuctions } = await geb.auctions.getDebtAuctions(
    startBlock
  );
  console.log(debtAuctions);
  return debtAuctions;
};

export const getSurplusAuctions = async (network, startBlock) => {
  const geb = initGeb(network);
  const { auctions: surplusAuctions } = await geb.auctions.getSurplusAuctions(
    startBlock
  );
  console.log(surplusAuctions);
  return surplusAuctions;
};

export const getCollateralAuctions = async (
  network,
  collateralSymbol,
  startBlock
) => {
  const geb = initGeb(network);
  const collateralAuctions = await geb.auctions.getCollateralAuctions(
    startBlock,
    collateralSymbol || "WETH"
  );
  // This should be a list of all collateral auctions,
  return collateralAuctions;
  // TODO Fetch additional data for each auction
  //   const collateralAuctionData = await fetchCollateralAuctionData(
  //     geb,
  //     collateralSymbol,
  //     [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  //   );
  //   let parsedCollateralAuctions = [];
  //   collateralAuctionData.map((auction, index) => {
  //     const collateralPrice = auction._boughtCollateral
  //       .mul(constants.WeiPerEther)
  //       .div(auction._adjustedBid);
  //     parsedCollateralAuctions[index] = {
  //       auctionId: auction._auctionId.toString(),
  //       price: ethers.utils.formatUnits(
  //         collateralPrice || constants.WeiPerEther,
  //         18
  //       ),
  //     };
  //   });
  return parsedCollateralAuctions;
};

export const getAuctionData = async (network) => {
  const geb = initGeb(network);
  const startBlock = (await geb.provider.getBlockNumber()) - 45000;

  const surplusAuctions = await getSurplusAuctions(network, startBlock);
  const debtAuctions = await getDebtAuctions(network, startBlock);

  // Collateral data
  let collateralAuctions = [];
  await Promise.all(
    Object.values(geb.tokenList)
      .filter((item) => item?.isCollateral)
      .map(async (token) => {
        const auctions = await getCollateralAuctions(
          network,
          token.symbol,
          startBlock
        );
        collateralAuctions.push({
          symbol: token.symbol,
          ...auctions,
        });
      })
  );

  const collatFields = collateralAuctions.reduce((acc, collateral) => {
    let f = [];
    f.push({
      name: ``,
      value: `🪙 **${collateral.symbol}**: ${collateral.auctions.length}`,
    });
    return acc.concat(f);
  }, []);

  const fields = [
    { name: "Surplus Auctions", value: `${surplusAuctions.length}` },
    { name: "Debt Auctions", value: `${debtAuctions.length}` },
    { name: "Collateral Auctions", value: "" },
    ...collatFields,
  ];

  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `📣  Auctions | ${network}`,
      footer: { text: new Date().toString() },
      fields: fields.slice(0, 24), // 25 item limit
    },
    channelName: "action",
  });

  //   console.log(auctionData);
  // Liquidation data
  //   const { tokenAnalyticsData } = await fetchAnalyticsData(geb);
  //   const liquidationData = await fetchLiquidationData(geb, tokenAnalyticsData);

  //   const systemState = {
  //     currentRedemptionPrice: {
  //       value: parseRay(liquidationData.redemptionPrice),
  //     },
  //     currentRedemptionRate: {
  //       // Calculate 8h exponentiation of the redemption rate
  //       annualizedRate: Math.pow(
  //         Number(parseRay(liquidationData.redemptionRate)),
  //         3600 * 24 * 365
  //       ).toString(),
  //     },
  //     globalDebt: parseRad(liquidationData.globalDebt),
  //     globalDebtCeiling: parseRad(liquidationData.globalDebtCeiling),
  //     perSafeDebtCeiling: parseWad(liquidationData.safeDebtCeiling),
  //   };

  //   const parsedLiquidationData = liquidationData.tokensLiquidationData.map(
  //     (tokenLiquidationData) =>
  //       parseTokenLiquidationData(
  //         liquidationData.redemptionPrice,
  //         tokenLiquidationData
  //       )
  //   );

  //   const collateralLiquidationData = Object.keys(tokenAnalyticsData).reduce(
  //     (accumulator, key, index) => {
  //       return { ...accumulator, [key]: parsedLiquidationData[index] };
  //     },
  //     {}
  //   );

  //   console.log({ systemState, collateralLiquidationData });
  //   return {
  //     systemState,
  //     collateralLiquidationData,
  //   };
};
