import { initGeb } from "./geb";

import { fetchAuctionData } from "@usekeyp/od-sdk/lib/virtual/virtualAuctionData.js";
import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";

export const getAuctionsForUser = async (network, proxyAddress) => {
  try {
    const geb = initGeb(network);
    return fetchAuctionData(geb, proxyAddress);
  } catch (e) {
    console.log("fetchAuctionData failed");
  }
};

export const getUser = async (network, userAddress) => {
  const proxyAddress = await getProxy(network, userAddress);
  if (!proxyAddress) {
    await createProxy(network);
    return null;
  }
  const auctions = await getAuctionsForUser(network, proxyAddress);
  console.log(auctions);
};

export const getProxy = async (network, userAddress) => {
  const geb = initGeb(network);
  try {
    const proxy = await geb.getProxyAction(userAddress);
    const proxyAddress = proxy.proxyAddress;
    console.log(`Proxy: ${proxyAddress}`);
    return proxyAddress;
  } catch (e) {
    console.log("Proxy not found");
    return null;
  }
};

const createProxy = async (network) => {
  try {
    const geb = initGeb(network);
    console.log("Creating Proxy...");
    const txData = await geb.contracts.proxyRegistry.populateTransaction[
      "build()"
    ]();
    const tx = await prepareTx({
      data: txData,
      method: "build",
      contractName: "proxyRegistry",
      textTitle: "Create a new proxy facilitator for the bot wallet",
      network,
    });
    const txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    console.log(`Transaction waiting to be mined... ${txResponse.hash} `);
    await txResponse.wait();

    console.log("Transaction mined, proxy created!");

    const { proxyAddress } = await geb.getProxyAction(userAddress);
    return proxyAddress;
  } catch (e) {
    console.log("Proxy creation error");
    console.log(e);
  }
};
