import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { sendAlert } from "../discord/alert";

import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { getStats } from "./analytics";
import { formatDataNumber, getExplorerBaseUrlFromName } from "./common";

const getTokenPrice = async (network, symbol) => {
  try {
    const stats = await getStats(network, true);
    const token = stats.tokenAnalyticsData.find(
      (token) => token.symbol === symbol
    );
    return token.currentPrice;
  } catch (e) {
    console.log("fetchAnalyticsData failed");
  }
};

export const updateTokenPrice = async (network, symbol, price) => {
  try {
    const geb = initGeb(network);
    const tokenList = Object.values(geb.tokenList).filter((token) =>
      ["FTRG", "STN", "TOTEM"].includes(token.symbol)
    );
    const token = tokenList.find((token) => token.symbol === symbol);
    if (!token) throw "Token not found";

    const currentPrice = await getTokenPrice(network, symbol);

    // Update price
    const params = await geb.contracts.oracleRelayer.cParams(
      token.bytes32String
    );
    const { oracle: delayedOracleAddress } = params;

    const initOracle = (address) =>
      new Contract(
        address,
        [
          "function priceSource() external view returns (address)",
          "function setPriceAndValidity(uint256,bool) external returns ()",
          "function getResultWithValidity() external view returns (uint256 result,bool validity)",
          "function getNextResultWithValidity() external view returns (uint256 result,bool validity)",
          "function shouldUpdate() external view returns (bool)",
          "function symbol() external view returns (string)",
          "function denominationPriceSource() external view returns (address)",
        ],
        Web3Providers[network]
      );

    // Delayed Oracle
    const delayedOracle = initOracle(delayedOracleAddress);
    const denominatedOracleAddress = await delayedOracle.priceSource();
    const delayedOracleSymbol = await delayedOracle.symbol();
    const shouldUpdate = await delayedOracle.shouldUpdate();
    const { result: previousPriceBn } =
      await delayedOracle.getResultWithValidity();
    const { result: nextPriceBn } =
      await delayedOracle.getNextResultWithValidity();

    // Denominated Oracle
    const denominatedOracle = initOracle(denominatedOracleAddress);
    const oracleForTestnetAddress = await denominatedOracle.priceSource();
    const denominatedOracleSymbol = await denominatedOracle.symbol();
    const { result: denominatedOraclePriceBn } =
      await denominatedOracle.getResultWithValidity();
    const denominationOracleAddress =
      await denominatedOracle.denominationPriceSource();

    // OracleForTestnet
    const oracleForTestnet = initOracle(oracleForTestnetAddress);
    const oracleForTestnetSymbol = await oracleForTestnet.symbol();
    const { result: oracleForTestnetPriceBn } =
      await oracleForTestnet.getResultWithValidity();

    // Denomination Price Source
    const denominationPriceSource = initOracle(denominationOracleAddress);
    const denominationPriceSourceSymbol =
      await denominationPriceSource.symbol();
    const { result: denominationPriceBn } =
      await denominationPriceSource.getResultWithValidity();

    // Update price
    const txData =
      await oracleForTestnet.populateTransaction.setPriceAndValidity(
        price,
        true
      );

    // const tx = await prepareTx({
    //   data: txData,
    //   method: "setPriceAndValidity",
    //   contractName: "OracleForTestnet",
    //   textTitle: "Updating token price",
    //   network,
    // });
    // const txResponse = await botSendTx({ unsigned: txData, network });
    // await tx.update({ hash: txResponse.hash });
    // console.log(`Transaction waiting to be mined... ${txResponse.hash} `);
    // await txResponse.wait();
    // console.log("Transaction mined, token price updated!");

    const { result: newPriceBn } = await delayedOracle.getResultWithValidity();

    const previousPrice = formatDataNumber(
      previousPriceBn?.toString() || "0",
      18,
      2,
      true
    );
    const newPrice = formatDataNumber(
      newPriceBn?.toString() || "0",
      18,
      2,
      true
    );

    let fields = [
      {
        name: "",
        value: `🪙 **[${token.symbol}](${getExplorerBaseUrlFromName(
          network
        )}address/${token.address})**`,
      },
      {
        name: "",
        value: `Updated **${currentPrice}** ➡️ **${newPrice}**`,
      },
      {
        name: `DelayedOracle ${delayedOracleSymbol} ${
          shouldUpdate ? "🟢 Update Ready" : "❄️ Cooling"
        }`,
        value: `Price: ${previousPriceBn}
Next: ${nextPriceBn}
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${delayedOracleAddress})`,
      },
      {
        name: `DenominatedOracle ${denominatedOracleSymbol}`,
        value: `Price: ${denominatedOraclePriceBn}
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${denominatedOracleAddress})`,
      },
      {
        name: `Denomination Oracle ${denominationPriceSourceSymbol}`,
        value: `Price: ${denominationPriceBn}
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${denominationOracleAddress})`,
      },
      {
        name: `OracleForTestnet ${oracleForTestnetSymbol}`,
        value: `Price: ${oracleForTestnetPriceBn}
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${oracleForTestnetAddress})`,
      },
    ];
    await sendAlert({
      embed: {
        color: 1900316,
        title: `🐞 Debug - Token | ${network}`,
        footer: { text: new Date().toString() },
        fields: fields.slice(0, 24), // 25 item limit
      },
      channelName: "action",
    });
  } catch (e) {
    console.log("modifyTokenPrice failed");
    console.log(e);
  }
};
