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
