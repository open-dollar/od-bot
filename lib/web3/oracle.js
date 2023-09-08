import { botSendTx } from "./wallets/bot";
import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName, prepareTx } from "./common";
import { Contract } from "@ethersproject/contracts";
import { Web3Providers } from "./provider";

import { initGeb } from "./geb";

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

export const updateOracles = async (network) => {
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
    channelName: "action",
  });
};

// Step 1. Update the delayed oracle
export const updateResult = async (network, cType) => {
  const geb = initGeb(network);
  const collateral = Object.values(geb.tokenList).find(
    (t) => t.bytes32String === cType
  );
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

    const txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    await txResponse.wait();
    return txResponse.hash;
  } catch (e) {
    console.log(e);
    await sendAlert({
      embed: {
        color: 15548997,
        title: `🦉 DelayedOracle 🚫 FAILED | ${network}`,
        description: `updateResult() failed for ${collateral?.symbol} with error: ${e} `,
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

    const txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    await txResponse.wait();
    return txResponse.hash;
  } catch (e) {
    console.log(e);
    await sendAlert({
      embed: {
        color: 15548997,
        title: `🦉 OracleRelayer 🚫 FAILED | ${network}`,
        description: `updateCollateralPrice() failed for collateral ${collateral?.symbol} with error: ${e} `,
        footer: { text: new Date().toString() },
      },
      channelName: "warning",
    });
    return null;
  }
};
