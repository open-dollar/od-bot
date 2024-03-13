import { initGeb } from "./geb";

import { fetchCollateralAuctionData } from "@opendollar/sdk/lib/virtual/virtualCollateralAuctionData.js";
import { fetchAuctionData } from "@opendollar/sdk/lib/virtual/virtualAuctionData.js";
import { fetchLiquidationData } from "@opendollar/sdk/lib/virtual/virtualLiquidationData.js";
import { sendAlert } from "../discord/alert";
import { ethers, constants } from "ethers";

export const getAuctionsData = async (network, proxyAddress) => {
  try {
    let address = "0x0000000000000000000000000000000000000000"
    if (proxyAddress) address = proxyAddress;
    const geb = initGeb(network);
    return fetchAuctionData(geb, address);
  } catch (e) {
    console.log("getAuctionsData failed");
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

  const { auctions } = await geb.auctions.getCollateralAuctions(
    0,
    collateralSymbol
  );

  const auctionIds = auctions.map((auction) => auction.auctionId);
  if (auctionIds.length === 0) return auctions;

  const collateralAuctionData = await fetchCollateralAuctionData(
    geb,
    collateralSymbol,
    auctionIds
  );

  let parsedCollateralAuctions = [];

  collateralAuctionData.map((auction, index) => {
    const collateralPrice = auction._boughtCollateral
      .mul(constants.WeiPerEther)
      .div(auction._adjustedBid);
    if (collateralPrice.isZero()) return;
    parsedCollateralAuctions[index] = {
      token: collateralSymbol,
      auctionId: auction._auctionId.toString(),
      price: ethers.utils.formatUnits(
        collateralPrice || constants.WeiPerEther,
        18
      ),
    };
  });

  return parsedCollateralAuctions;
};

export const getAuctionData = async (network, channelId) => {
  const geb = initGeb(network);

  const startBlock = (await geb.provider.getBlockNumber()) - 45000;

  const surplusAuctions = await getSurplusAuctions(network, startBlock);
  const debtAuctions = await getDebtAuctions(network, startBlock);

  const auctionDataRaw = await getAuctionsData(network);
  const auctionData = Object.entries(auctionDataRaw).filter(([key]) =>
    !key.match(/^[0-9]|Balance/)
  )
  const auctionsText = auctionData.reduce(
    (acc, [key, value]) => {
      const text = Object.entries(value).reduce(
        (acc, [key, value]) => {
          if (key.match(/^[0-9]/)) return acc
          return acc + `${key}: ${value} \n`
        },
        ""
      )
      return acc + `**${key}**: \n${text} \n`
    },
    ""
  )

  let collatFields = [];
  let collateralAuctions = {};
  await Promise.all(
    Object.values(geb.tokenList)
      .filter((item) => item?.isCollateral)
      .map(async (token) => {
        const auctions = await getCollateralAuctions(
          network,
          token.symbol,
          startBlock
        );
        collateralAuctions[token.symbol] = auctions;

        collatFields.push({
          name: ``,
          value: `🪙 **${token.symbol}**: ${auctions?.length}`,
        });
      })
  );


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
    channelId,
    channelName: "action",
  });
  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `📣  Auctions | ${network}`,
      footer: { text: new Date().toString() },
      description: auctionsText
    },
    channelId,
    channelName: "action",
  });
};
