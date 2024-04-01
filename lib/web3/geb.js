import { Geb } from "@opendollar/sdk";

import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";

export const initGeb = (network) => {
  const provider = Web3Providers[network];
  const networkMap = (network) => {
    if (network === "OPTIMISM") return "optimism";
    if (network === "OPTIMISM_GOERLI") return "optimism-goerli";
    if (network === "ARBITRUM_SEPOLIA") return "arbitrum-sepolia";
    return network.toLowerCase();
  };
  return new Geb(networkMap(network), provider);
};

export const setupBotProxy = async (network) => {
  const geb = initGeb(network);
  const proxyAddress = await geb.contracts.proxyRegistry.getProxy(
    process.env.BOT_WALLET_ADDRESS.toLowerCase()
  );
  if (
    !proxyAddress ||
    proxyAddress === "0x0000000000000000000000000000000000000000"
  ) {
    try {
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
    } catch (e) {
      console.log("Proxy creation error");
      console.log(e);
    }
  }
};
