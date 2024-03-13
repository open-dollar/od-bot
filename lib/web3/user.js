import { initGeb } from "./geb";
import { sendAlert } from "../discord/alert";
import { Web3Providers } from "./provider";
import { Contract } from "@ethersproject/contracts";

import { fetchAuctionData } from "@opendollar/sdk/lib/virtual/virtualAuctionData.js";
import { getExplorerBaseUrlFromName, formatDataNumber } from "./common";

export const getTokenBalances = async (network, userAddress, _tokenList) => {
  try {
    let tokenList = _tokenList;
    if (!tokenList) {
      const geb = initGeb(network);
      tokenList = Object.values(geb.tokenList)
    }

    let balances = {};
    for (let i = 0; i < tokenList.length; i++) {
      const token = tokenList[i];
      const contract = new Contract(
        token.address,
        [
          "function balanceOf(address) external view returns (uint256)",
          "function decimals() external view returns (uint256)",
        ],
        Web3Providers[network]
      );
      const balanceOf = await contract.balanceOf(userAddress);
      balances[token.symbol] = formatDataNumber(
        balanceOf.toString() || "0",
        token.decimals,
        2,
        false,
        true
      );
    }
    return balances;
  } catch (e) {
    console.log("getTokenBalance error");
    console.log(e);
  }
};

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
  let proxyAddress
  if (network === 'OPTIMISM' && geb.contracts?.proxyFactory) {
    proxyAddress = await geb.contracts?.proxyFactory.proxies(userAddress)
  } else {
    proxyAddress = await geb.contracts.proxyRegistry.getProxy(ownerAddress)
  }
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

  const balances = await getTokenBalances(network, userAddress);
  const auctions = await getAuctionsForUser(network, proxyAddress);
  const user = { address: userAddress, proxyAddress, auctions, balances };

  const fields = [
    {
      name: ``,
      value: `Wallet: [${userAddress}](${getExplorerBaseUrlFromName(
        network
      )}address/${userAddress})
Proxy: [${user.proxyAddress}](${getExplorerBaseUrlFromName(network)}address/${user.proxyAddress
        })`,
    }
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
  // Auction data is large, so send in separate message

  const auctionsText = Object.entries(auctions).reduce(
    (acc, [key, value]) => acc + `${key}: ${value} \n`,
    ""
  )
  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `🧘  User | ${network}`,
      footer: { text: new Date().toString() },
      description: `Auctions Data \n ${auctionsText}`,
      // fields: [{ name: "Auctions", value: auctionsText }], // 25 item limit
    },
    channelId,
    channelName: "action",

  });


  return user;
};
