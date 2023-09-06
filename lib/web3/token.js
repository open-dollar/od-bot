import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { parseUnits } from "@ethersproject/units";
import { sendAlert } from "../discord/alert";

import { fetchAuctionData } from "@usekeyp/od-sdk/lib/virtual/virtualAuctionData.js";
import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { getExplorerBaseUrlFromName } from "./common";
import { getStats } from "./analytics";

const getTokenPrice = async (network, symbol) => {
  try {
    const stats = await getStats(network);
    const token = stats.tokenAnalyticsData.find(
      (token) => token.symbol === symbol
    );
    return token.currentPrice;
  } catch (e) {
    console.log("fetchAnalyticsData failed");
  }
};

export const updateTokenPrice = async (network, symbol, price) => {
  try {
    const geb = initGeb(network);
    const tokenList = Object.values(geb.tokenList).filter((token) =>
      ["FTRG", "STN", "TOTEM"].includes(token.symbol)
    );
    const token = tokenList.find((token) => token.symbol === symbol);
    if (!token) throw "Token not found";
    console.log(token);

    // const currentPrice = await getTokenPrice(network, symbol);

    // Update price
    const params = await geb.contracts.oracleRelayer.cParams(
      token.bytes32String
    );
    const { oracle: oracleAddress } = params;
    console.log(oracleAddress);
    const oracleContract = new Contract(
      oracleAddress,
      ["function setPriceAndValidity(uint256,bool) external view returns ()"],
      Web3Providers[network]
    );
    const txData = await oracleContract.populateTransaction.setPriceAndValidity(
      price,
      true
    );
    const tx = await prepareTx({
      data: txData,
      method: "setPriceAndValidity",
      contractName: "OracleForTestnet",
      textTitle: "Updating token price",
      network,
    });
    const txResponse = await botSendTx({ unsigned: txData, network });
    await tx.update({ hash: txResponse.hash });
    console.log(`Transaction waiting to be mined... ${txResponse.hash} `);
    await txResponse.wait();
    console.log("Transaction mined, token price updated!");

    // const newPrice = await getTokenPrice(network, symbol);

    // let fields = [
    //   {
    //     name: "",
    //     value: `🪙 **[${token.symbol}](${getExplorerBaseUrlFromName(
    //       network
    //     )}address/${token.address})** Price updated`,
    //   },
    //   {
    //     name: "",
    //     value: `**${currentPrice}** ➡️ **${newPrice}**`,
    //   },
    // ];
    // await sendAlert({
    //   embed: {
    //     color: 1900316,
    //     title: `🐞 Debug - Token | ${network}`,
    //     footer: { text: new Date().toString() },
    //     fields: fields.slice(0, 24), // 25 item limit
    //   },
    //   channelName: "action",
    // });
  } catch (e) {
    console.log("modifyTokenPrice failed");
    console.log(e);
  }
};

const claimTestTokens = async (network, userAddress) => {
  try {
    const geb = initGeb(network);

    let balances = {};
    for (let i = 0; i < tokenList.length; i++) {
      const token = tokenList[i];
      const contract = new Contract(
        token.address,
        [
          "function balanceOf(address) external view returns (uint256)",
          "function mint(address,uint256) external view returns (uint256)",
          "function symbol() external view returns (string)",
        ],
        Web3Providers[network]
      );
      const balanceOf = await contract.balanceOf(userAddress);
      balances[token.symbol] = balanceOf.toString();
      if (balanceOf.gt(parseUnits("0"))) {
        console.log(`User balance ${token.symbol}: ${balanceOf.toString()}`);
      } else {
        const amountString = {
          FTRG: "10000000000000000000000",
          TOTEM: "10000",
          STN: "10000000",
        }[token.symbol];
        const txData = await contract.populateTransaction.mint(
          userAddress,
          amountString
        );
        const tx = await prepareTx({
          data: txData,
          method: "mint",
          contractName: token.symbol,
          textTitle: "Minting test tokens",
          network,
        });
        const txResponse = await botSendTx({ unsigned: txData, network });
        await tx.update({ hash: txResponse.hash });
        console.log(`Transaction waiting to be mined... ${txResponse.hash} `);
        await txResponse.wait();
        console.log("Transaction mined, test tokens minted!");
      }
    }
    return balances;
  } catch (e) {
    console.log("Test token minting error");
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

export const getUser = async (network, userAddress) => {
  const proxyAddress = await getProxy(network, userAddress);
  if (!proxyAddress) {
    // Bot wallet proxy creation
    // await createProxy(network);
    return console.log("No Proxy, uncomment above to create one ");
  }

  const balances = await claimTestTokens(network, userAddress);
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
