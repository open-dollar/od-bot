import { initGeb } from "./geb";
import { sendAlert } from "../discord/alert";
import { Web3Providers } from "./provider";
import { Contract } from "@ethersproject/contracts";
import { getAuctionsData } from "./auction";
import { fetchUserSafes } from '@opendollar/sdk/lib/virtual/virtualUserSafes.js'
import { parseWad } from './common'
import { getExplorerBaseUrlFromName, formatDataNumber } from "./common";

export const getUserVaults = async (network, userAddress) => {
  const geb = initGeb(network);
  const [userCoinBalance, safesData] = await fetchUserSafes(geb, userAddress)
  const safes = safesData.map((safe) => ({
    collateral: parseWad(safe.lockedCollateral),
    debt: parseWad(safe.generatedDebt),
    safeHandler: safe.addy,
    safeId: safe.id.toString(),
    collateralType: safe.collateralType,
  }))
  const safesByCollateralType = safes.reduce((acc, safe) => {
    const symbol = Object.entries(geb.tokenList).find(([key, val]) => val.bytes32String === safe.collateralType)[0]
    if (!acc[symbol]) {
      acc[symbol] = [safe];
    } else {
      acc[symbol].push(safe);
    }
    return acc;
  }, {});
  return safesByCollateralType
}

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

export const getAuctionsUserData = async (network, proxyAddress) => {
  try {
    const auctionsRaw = await getAuctionsData(network, proxyAddress);
    return Object.entries(auctionsRaw).filter(([key]) =>
      key.includes("coin")
    )
  } catch (e) {
    console.log("getAuctionsUserData failed");
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
              "To start using the protocol, you must first deploy a Vault Facilitator in the app",
          },
        ],
      },
      channelId,
      channelName: "action",

    });
  }

  const balances = await getTokenBalances(network, userAddress);
  const auctions = await getAuctionsUserData(network, proxyAddress);
  const vaults = await getUserVaults(network, userAddress);
  const user = { address: userAddress, proxyAddress, auctions, balances, vaults };

  const vaultsText = Object.entries(vaults).reduce(
    (acc, [key, value]) => {
      const ids = value.map((safe) => safe.safeId).join(", ");
      return acc + `${key}: ${ids} \n`
    },
    ""
  )
  const auctionsText = auctions.reduce(
    (acc, [key, value]) => acc + `${key}: ${value} \n`,
    ""
  )
  const fields = [
    {
      name: ``,
      value: `Wallet: [${userAddress}](${getExplorerBaseUrlFromName(
        network
      )}address/${userAddress})
Proxy: [${user.proxyAddress}](${getExplorerBaseUrlFromName(network)}address/${user.proxyAddress
        })`,
    },
    { name: "Vault IDs", value: vaultsText },
    { name: "Auctions", value: auctionsText }

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
