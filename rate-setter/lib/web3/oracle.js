import { Geb, utils } from "@usekeyp/od-sdk";

import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName, prepareTx, readManyVars } from "./common";
import { getStats } from "./analytics";

import { initGeb } from "./geb";

export const updateOracles = async (network) => {
  await updateCollateralPrices(network);
  await updateRedemptionPrice(network);
};

const updateRedemptionPrice = async (network) => {
  try {
    const geb = initGeb(network);
    const txData =
      await geb.contracts.oracleRelayer.populateTransaction.redemptionPrice();
    const tx = await prepareTx({
      data: txData,
      method: "redemptionPrice",
      contractName: "oracleRelayer",
      textTitle: `Fetch the latest redemption price by first updating it`,
      network,
    });

    const txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    await sendAlert({
      embed: {
        color: 1900316,
        title: `🦉 OracleRelayer 🔃 UPDATED | ${network}`,
        description: `redemptionPrice() - [receipt](${getExplorerBaseUrlFromName(
          network
        )}tx/${txResponse.hash})`,
        footer: { text: new Date().toString() },
      },
      channelName: "action",
    });
  } catch (e) {
    console.log(e);
    await sendAlert({
      embed: {
        color: 15548997,
        title: `🦉 OracleRelayer 🚫 FAILED | ${network}`,
        description: `redemptionPrice() failed with error: ${e} `,
        footer: { text: new Date().toString() },
      },
      channelName: "warning",
    });
  }
};

const updateCollateralPrices = async (network) => {
  const geb = initGeb(network);

  const collateralCTypes = await geb.contracts.oracleRelayer.collateralList();

  let fields = [];
  for (let i = 0; i <= collateralCTypes.length - 1; i++) {
    const updatedCollateral = await updateCollateralPrice(
      network,
      collateralCTypes[i]
    );
    if (updatedCollateral) {
      fields.push({
        name: "",
        value: `🪙  **[${
          updatedCollateral.symbol
        }](${getExplorerBaseUrlFromName(network)}address/${
          updatedCollateral.address
        })** - [receipt](${getExplorerBaseUrlFromName(network)}tx/${
          updatedCollateral.hash
        })`,
      });
    }
  }

  await sendAlert({
    embed: {
      color: 1900316,
      title: `🦉 OracleRelayer 🔃 UPDATED | ${network}`,
      description: `updateCollateralPrice()`,
      fields: fields.slice(0, 24),
      footer: { text: new Date().toString() },
    },
    channelName: "action",
  });
};

const updateCollateralPrice = async (network, cType) => {
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

    return { hash: txResponse.hash, ...collateral };
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
  }
};
