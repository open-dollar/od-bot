import { botBalance, botSendTx } from "./wallets/bot";
import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName, prepareTx } from "./common";
import { Contract } from "@ethersproject/contracts";
import { formatEther } from "@ethersproject/units";
import { Web3Providers } from "./provider";

import { initGeb } from "./geb";
const MAINNET_CHAINLINK_ETH_USD_RELAYER = "0x3e6C1621f674da311E57646007fBfAd857084383";

export const initOracle = (network, address) =>
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

export const updateOracles = async (network, channelId) => {
  const geb = initGeb(network);

  const collateralCTypes = await geb.contracts.oracleRelayer.collateralList();

  let fields = [];
  for (let i = 0; i <= collateralCTypes.length - 1; i++) {
    const collateral = Object.values(geb.tokenList).find(
      (t) => t.bytes32String === collateralCTypes[i]
    );
    let text = `🪙  **[${collateral?.symbol}](${getExplorerBaseUrlFromName(
      network
    )}address/${collateral?.address})**`;

    const updatedResultHash = await updateResult(network, collateralCTypes[i]);
    text = text.concat("\n", `updateResult() - `);
    text = text.concat(
      updatedResultHash
        ? `[receipt](${getExplorerBaseUrlFromName(
          network
        )}tx/${updatedResultHash})`
        : "Not updated"
    );

    // NOTE: troubleshooting why updateCollateralPrice often fails. Maybe due to block timestamp issues
    async function delay() {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    // await delay();

    const updateCollateralPriceHash = await updateCollateralPrice(
      network,
      collateralCTypes[i]
    );
    text = text.concat("\n", `updateCollateralPrice() - `);
    text = text.concat(
      updateCollateralPriceHash
        ? `[receipt](${getExplorerBaseUrlFromName(
          network
        )}tx/${updateCollateralPriceHash})`
        : "Not updated"
    );

    fields.push({ name: "", value: text });
  }

  await sendAlert({
    embed: {
      color: 1900316,
      title: `🦉 Oracles 🔃 UPDATED | ${network}`,
      fields: fields.slice(0, 24),
      footer: { text: new Date().toString() },
    },
    channelId,
    channelName: "action",

  });
};

// Step 1. Update the delayed oracle
export const updateResult = async (network, cType) => {
  const geb = initGeb(network);
  const collateral = Object.values(geb.tokenList).find(
    (t) => t.bytes32String === cType
  );
  let txResponse;
  try {
    const params = await geb.contracts.oracleRelayer.cParams(cType);
    const { oracle: delayedOracleAddress } = params;
    const delayedOracle = initOracle(network, delayedOracleAddress);
    const shouldUpdate = await delayedOracle.shouldUpdate();
    if (!shouldUpdate) return null;

    const txData = await delayedOracle.populateTransaction.updateResult();
    const tx = await prepareTx({
      data: txData,
      method: "updateResult",
      contractName: "DelayedOracle",
      textTitle: `Updates the price for a collateral on the Delayed Oracle`,
      network,
    });

    txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    await txResponse.wait();
    return txResponse.hash;
  } catch (e) {
    console.log(e);
    const gasBalance = await botBalance({ network });
    const formattedGasBalance = formatEther(gasBalance);
    await sendAlert({
      embed: {
        color: 15548997,
        title: `🦉 DelayedOracle 🚫 FAILED | ${network}`,
        description: `updateResult() failed for ${collateral?.symbol}
        ${txResponse?.hash ? `[receipt](${getExplorerBaseUrlFromName(network)}tx/${txResponse?.hash})` : ""
          }
        Gas Balance: ${formattedGasBalance} ETH
\`\`\`js
${e}\`\`\``,
        footer: { text: new Date().toString() },
      },
      channelName: "warning",
    });
    return null;
  }
};

// Step 2. Update the collateral price for the system
export const updateCollateralPrice = async (network, cType) => {
  const geb = initGeb(network);
  const collateral = Object.values(geb.tokenList).find(
    (t) => t.bytes32String === cType
  );
  let txResponse;
  try {
    const txData =
      await geb.contracts.oracleRelayer.populateTransaction.updateCollateralPrice(
        cType
      );
    const tx = await prepareTx({
      data: txData,
      method: "updateCollateralPrice",
      contractName: "oracleRelayer",
      textTitle: `${collateral?.symbol} - Allows an authorized contract to update the safety price and liquidation price of a collateral type`,
      network,
    });

    txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    await txResponse.wait();
    return txResponse.hash;
  } catch (e) {
    console.log(e);
    const gasBalance = await botBalance({ network });
    const formattedGasBalance = formatEther(gasBalance);
    await sendAlert({
      embed: {
        color: 15548997,
        title: `🦉 OracleRelayer 🚫 FAILED | ${network}`,
        description: `updateCollateralPrice() failed for collateral ${collateral?.symbol}
${txResponse?.hash ? `[receipt](${getExplorerBaseUrlFromName(network)}tx/${txResponse?.hash})` : ""}
Gas Balance: ${formattedGasBalance} ETH
\`\`\`js
${e}
\`\`\``,
        footer: { text: new Date().toString() },
      },
      channelName: "warning",
    });
    return null;
  }
};

export const getEthPrice = async () => {
  return 3000
  const ethOracle = initOracle("ARITRUM", MAINNET_CHAINLINK_ETH_USD_RELAYER)
  const { result } = await ethOracle.getResultWithValidity()
  const ethPrice = parseFloat(formatUnits(result, 18))
  return ethPrice
}