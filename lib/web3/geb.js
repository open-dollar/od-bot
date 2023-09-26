import { Geb } from "@opendollar/sdk";

import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";

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
