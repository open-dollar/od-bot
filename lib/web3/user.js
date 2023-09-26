import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { parseUnits } from "@ethersproject/units";
import { sendAlert } from "../discord/alert";

import { fetchAuctionData } from "@opendollar/sdk/lib/virtual/virtualAuctionData.js";
import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { getExplorerBaseUrlFromName } from "./common";
import { getTestTokenBalance } from "./claim";

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
    // Bot wallet proxy creation
    // await createProxy(network);
    console.log("No Vault Facilitator, uncomment above to create one ");
    return await sendAlert({
      embed: {
        color: 0xffffd0,
        title: `👽  User | ${network}`,
        footer: { text: new Date().toString() },
        fields: [
          {
            name: ``,
            value: `User: [${userAddress}](${getExplorerBaseUrlFromName(
              network
            )}address/${userAddress})`,
          },
          {
            name: "No Vault Facilitator found...",
            value:
              "This user address has not yet interacted with Open Dollar. Use https://app.opendollar.com to deploy a Vault Facilitator.",
          },
        ],
      },
      channelName: "action",
    });
  }

  const balances = await getTestTokenBalance(network, userAddress);
  const auctions = await getAuctionsForUser(network, proxyAddress);
  const user = { address: userAddress, proxyAddress, auctions, balances };

  const auctionsText = Object.entries(auctions).reduce(
    (acc, [key, value]) => acc + `${key}: ${value} \n`,
    ""
  );
  const fields = [
    {
      name: ``,
      value: `Wallet: [${userAddress}](${getExplorerBaseUrlFromName(
        network
      )}address/${userAddress})
Proxy: [${user.proxyAddress}](${getExplorerBaseUrlFromName(network)}address/${
        user.proxyAddress
      })`,
    },
    { name: "Auctions", value: auctionsText },
  ];
  if (user.balances) {
    const text = Object.entries(user.balances).reduce(
      (acc, [key, value]) => acc + `${key}: ${value} \n`,
      ""
    );
    fields.push({
      name: "Collateral Balances",
      value: text,
    });
  }
  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `👽  User | ${network}`,
      footer: { text: new Date().toString() },
      fields: fields.slice(0, 24), // 25 item limit
    },
    channelName: "action",
  });
  return user;
};

export const getProxy = async (network, userAddress) => {
  const geb = initGeb(network);
  try {
    const proxyAddress = await geb.contracts.proxyRegistry.getProxy(
      userAddress
    );
    console.log(`Proxy: ${proxyAddress}`);
    return proxyAddress;
  } catch (e) {
    console.log("Proxy not found");
    console.log(e);
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
  } catch (e) {
    console.log("Proxy creation error");
    console.log(e);
  }
};
