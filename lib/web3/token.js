import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { sendAlert } from "../discord/alert";

import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { formatDataNumber, getExplorerBaseUrlFromName } from "./common";

const initOracle = (network, address) =>
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
      "function updateResult() external returns ()",
    ],
    Web3Providers[network]
  );

const getTokenPrice = async (network, symbol) => {
  try {
    const geb = initGeb(network);
    const tokenList = Object.values(geb.tokenList).filter((token) =>
      ["FTRG", "STN", "TOTEM"].includes(token.symbol)
    );
    const token = tokenList.find((token) => token.symbol === symbol);
    if (!token) throw "Token not found";
    const params = await geb.contracts.oracleRelayer.cParams(
      token.bytes32String
    );
    const { oracle: oracleAddress } = params;
    const oracle = initOracle(network, oracleAddress);
    const { result: priceBn } = await oracle.getResultWithValidity();
    return formatDataNumber(priceBn?.toString() || "0", 18, 2, true);
  } catch (e) {
    console.log("getTokenPrice failed");
  }
};

export const updateTokenPrice = async (network, symbol, price, execute) => {
  try {
    const geb = initGeb(network);
    const tokenList = Object.values(geb.tokenList).filter((token) =>
      ["FTRG", "STN", "TOTEM"].includes(token.symbol)
    );
    const token = tokenList.find((token) => token.symbol === symbol);
    if (!token) throw "Token not found";

    const params = await geb.contracts.oracleRelayer.cParams(
      token.bytes32String
    );
    const { oracle: delayedOracleAddress } = params;

    // Delayed Oracle
    const delayedOracle = initOracle(network, delayedOracleAddress);
    const denominatedOracleAddress = await delayedOracle.priceSource();
    const delayedOracleSymbol = await delayedOracle.symbol();
    const shouldUpdate = await delayedOracle.shouldUpdate();

    // Denominated Oracle
    const denominatedOracle = initOracle(network, denominatedOracleAddress);
    const oracleForTestnetAddress = await denominatedOracle.priceSource();
    const denominatedOracleSymbol = await denominatedOracle.symbol();
    const denominationOracleAddress =
      await denominatedOracle.denominationPriceSource();

    // OracleForTestnet
    const oracleForTestnet = initOracle(network, oracleForTestnetAddress);
    const oracleForTestnetSymbol = await oracleForTestnet.symbol();

    // Denomination Price Source
    const denominationPriceSource = initOracle(
      network,
      denominationOracleAddress
    );
    const denominationPriceSourceSymbol =
      await denominationPriceSource.symbol();

    const getOracleResults = async () => {
      const { result: delayedOracleNextPriceBn } =
        await delayedOracle.getNextResultWithValidity();
      const { result: delayedOraclePriceBn } =
        await delayedOracle.getResultWithValidity();
      const { result: denominatedOraclePriceBn } =
        await denominatedOracle.getResultWithValidity();
      const { result: oracleForTestnetPriceBn } =
        await oracleForTestnet.getResultWithValidity();
      const { result: denominationPriceBn } =
        await denominationPriceSource.getResultWithValidity();
      return {
        delayedOraclePriceBn,
        delayedOracleNextPriceBn,
        denominatedOraclePriceBn,
        oracleForTestnetPriceBn,
        denominationPriceBn,
      };
    };

    const before = await getOracleResults();

    // Update price
    let receiptHashPrice;
    let receiptHashOracle;
    if (execute) {
      const txData =
        await oracleForTestnet.populateTransaction.setPriceAndValidity(
          price,
          true
        );

      const tx = await prepareTx({
        data: txData,
        method: "setPriceAndValidity",
        contractName: "OracleForTestnet",
        textTitle: "Updating token price",
        network,
      });
      const txResponse = await botSendTx({ unsigned: txData, network });
      await tx.update({ hash: txResponse.hash });
      console.log(`Transaction waiting to be mined... ${txResponse.hash} `);
      await txResponse.wait();
      console.log("Transaction mined, token price updated!");
      receiptHashPrice = txResponse.hash;

      // Update oracle (this is failing)
      // await updateCollateralPrice(network, token.bytes32String);

      if (shouldUpdate) {
        // Delayed oracle is ready to update
        const txData = await delayedOracle.populateTransaction.updateResult();

        const tx = await prepareTx({
          data: txData,
          method: "updateResult",
          contractName: "DelayedOracle",
          textTitle: "Update oracle",
          network,
        });
        const txResponse = await botSendTx({ unsigned: txData, network });
        await tx.update({ hash: txResponse.hash });
        console.log(`Transaction waiting to be mined... ${txResponse.hash} `);
        await txResponse.wait();
        console.log("Transaction mined, token price updated!");
        receiptHashOracle = txResponse.hash;
      }
    }

    const after = await getOracleResults();

    // const previousPrice = formatDataNumber(
    //   previousPriceBn?.toString() || "0",
    //   18,
    //   2,
    //   true
    // );
    // const newPrice = formatDataNumber(
    //   newPriceBn?.toString() || "0",
    //   18,
    //   2,
    //   true
    // );

    let fields = [
      {
        name: "",
        value: `🪙 **[${token.symbol}](${getExplorerBaseUrlFromName(
          network
        )}address/${token.address})**`,
      },
      {
        name: "",
        value: `Input price ${price}
Old **${currentPrice}** ➡️ New **${newPrice}**
${
  receiptHashPrice
    ? `Price update [receipt](${getExplorerBaseUrlFromName(
        network
      )}tx/${receiptHashPrice})
${
  receiptHashOracle
    ? `Oracle update [receipt](${getExplorerBaseUrlFromName(
        network
      )}tx/${receiptHashOracle})`
    : "Oracle update still cooling down"
}`
    : "(Dry Run Only)"
}`,
      },
      {
        name: `DelayedOracle ${delayedOracleSymbol} ${
          shouldUpdate ? "🟢 Update Ready" : "❄️ Cooling"
        }`,
        value: `${before.delayedOraclePriceBn}
${before.delayedOracleNextPriceBn} Next
⬇️
${after.delayedOraclePriceBn}
${after.delayedOracleNextPriceBn} Next
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${delayedOracleAddress})`,
      },
      {
        name: `DenominatedOracle ${denominatedOracleSymbol}`,
        value: `${before.denominatedOraclePriceBn}
⬇️
${after.denominatedOraclePriceBn}
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${denominatedOracleAddress})`,
      },
      {
        name: `Denomination Oracle ${denominationPriceSourceSymbol}`,
        value: `${before.denominationPriceBn}
⬇️
${after.denominationPriceBn}
[contract](${getExplorerBaseUrlFromName(
          network
        )}address/${denominationOracleAddress})`,
      },
      {
        name: `OracleForTestnet ${oracleForTestnetSymbol}`,
        value: `${before.oracleForTestnetPriceBn}
⬇️
${after.oracleForTestnetPriceBn}
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
