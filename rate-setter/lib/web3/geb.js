import { Geb } from "@usekeyp/od-sdk";

import prisma from "../prisma";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { sendAlert } from "../discord/alert";
import { getExplorerBaseUrlFromName } from "./common";

import { prepareTx } from "./common";

export const initGeb = (network) => {
  const provider = Web3Providers[network];
  const networkMap = (network) => {
    if (network === "OPTIMISM_GOERLI") return "optimism-goerli";
    if (network === "ARBITRUM_GOERLI") return "arbitrum-goerli";
    return network.toLowerCase();
  };
  return new Geb(networkMap(network), provider);
};

export const setupProxy = async (network) => {
  const geb = initGeb(network);
  try {
    proxy = await geb.getProxyAction(wallet.address);
    const proxyAddress = proxy.proxyAddress;
    console.log(`DSProxy exists for this wallet: ${proxyAddress}`);
  } catch (e) {
    try {
      console.log("No DSProxy found, creating one...");
      const txData = await geb.contracts.proxyRegistry.populateTransaction[
        "build()"
      ]();
      const txResponse = await botSendTx({ unsigned: txData, network });
      console.log(`Transaction ${txResponse.hash} waiting to be mined...`);
      await txResponse.wait();
      console.log("Transaction mined, proxy created!");
    } catch (e) {
      console.log("DSProxy deployment error");
      console.log(e);
    }
  }
};

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
    const tx = await prepareTx({ data: txData, method: "updateRate", network }); // Updates the db with the unsigned tx
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
