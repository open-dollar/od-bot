import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { parseUnits } from "@ethersproject/units";
import { sendAlert } from "../discord/alert";

import { fetchAuctionData } from "@opendollar/sdk/lib/virtual/virtualAuctionData.js";
import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
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

export const getUser = async (network, userAddress, channelId) => {
  const geb = initGeb(network);
  const proxyAddress = await geb.contracts.proxyRegistry.getProxy(userAddress);
  if (
    !proxyAddress ||
    proxyAddress === "0x0000000000000000000000000000000000000000"
  ) {
    // Bot wallet proxy creation
    // await createProxy(network);
    console.log("No Vault Facilitator, uncomment above to create one ");
    return await sendAlert({
      embed: {
        color: 0xffffd0,
        title: `🧘  User | ${network}`,
        footer: { text: new Date().toString() },
        fields: [
          {
            name: "👋 Welcome new user!",
            value:
              "To start using Open Dollar, you must first deploy a Vault Facilitator in the app https://app.opendollar.com",
          },
        ],
      },
      channelId,
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
Proxy: [${user.proxyAddress}](${getExplorerBaseUrlFromName(network)}address/${user.proxyAddress
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
      title: `🧘  User | ${network}`,
      footer: { text: new Date().toString() },
      fields: fields.slice(0, 24), // 25 item limit
    },
    channelId,
    channelName: "action",

  });
  return user;
};
