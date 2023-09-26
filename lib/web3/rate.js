import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName } from "./common";
import { initGeb } from "./geb";
import { botSendTx } from "./wallets/bot";

import { prepareTx } from "./common";

export const shouldUpdateRate = async (network) => {
  const geb = initGeb(network);

  const updateRateDelay = (
    await geb.contracts.rateSetter.params()
  ).updateRateDelay.toNumber();
  let lastUpdateTime = (
    await geb.contracts.rateSetter.lastUpdateTime()
  ).toNumber();
  const blockTimestamp = (await geb.provider.getBlock()).timestamp;
  const nextUpdateTime = new Date((lastUpdateTime + updateRateDelay) * 1000);

  if (blockTimestamp - lastUpdateTime < updateRateDelay) {
    await sendAlert({
      embed: {
        color: 7452131,
        title: `📈  RateSetter Cooldown ❄️ Cooling | ${network}`,
        fields: [
          {
            name: "Last",
            value: new Date(lastUpdateTime * 1000).toString(),
            inline: true,
          },
          {
            name: "Next",
            value: nextUpdateTime.toString(),
            inline: true,
          },
        ],
        footer: { text: new Date().toString() },
      },
      channelName: "action",
    });
    return false;
  } else {
    await sendAlert({
      embed: {
        color: 7452131,
        title: `📈  RateSetter Cooldown 🟢 Ready | ${network}`,
        fields: [
          {
            name: "Last",
            value: new Date(lastUpdateTime * 1000).toString(),
          },
        ],
        footer: { text: new Date().toString() },
      },
      channelName: "action",
    });
    return true;
  }
};

export const updateRate = async (network) => {
  const geb = initGeb(network);
  const ready = await shouldUpdateRate(network);

  if (ready) {
    const geb = initGeb(network);
    const txData =
      await geb.contracts.rateSetter.populateTransaction.updateRate();
    const tx = await prepareTx({
      data: txData,
      method: "updateRate",
      contractName: "PIDRateSetter",
      textTitle:
        "Retrieves market and redemption prices from the Oracle Relayer and prompts the PID Controller to compute the new redemption rate.",
      network,
    });
    const txResponse = await botSendTx({
      unsigned: { to: geb.contracts.rateSetter.address, ...txData },
      network,
    });
    console.log(`Transaction ${txResponse.hash} waiting to be mined...`);
    await txResponse.wait();
    await tx.update({ hash: txResponse.hash });
    await sendAlert({
      embed: {
        color: 1900316,
        title: `📈 RateSetter 🔃 UPDATED | ${network} `,
        description: `${getExplorerBaseUrlFromName(network)}tx/${
          txResponse.hash
        }`,
        footer: { text: new Date().toString() },
      },
      channelName: "action",
    });
    console.log("Transaction mined, rate set!");
  }
};

const updateRedemptionPrice = async (network) => {
  // No longer needed. This is already called during PIDRateSetter.updateRate()
  // and for each oracleRelayer.updateCollateralPrice()
  // Left here for brevity
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
