import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { isAddress } from "@ethersproject/address";
import { sendAlert } from "../discord/alert";

import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { getExplorerBaseUrlFromName } from "./common";

const getMintableTokens = (network) => {
  const geb = initGeb(network);
  return Object.values(geb.tokenList).filter((token) =>
    [
      "FTRG",
      "STN",
      "TOTEM",
      "WSTETH",
      "CBETH",
      "RETH",
      "ARB",
      "MAGIC",
    ].includes(token.symbol)
  );
};

export const getTestTokenBalance = async (network, userAddress) => {
  try {
    const tokenList = getMintableTokens(network);
    let balances = {};
    for (let i = 0; i < tokenList.length; i++) {
      const token = tokenList[i];
      const contract = new Contract(
        token.address,
        ["function balanceOf(address) external view returns (uint256)"],
        Web3Providers[network]
      );
      const balanceOf = await contract.balanceOf(userAddress);
      balances[token.symbol] = balanceOf.toString();
    }
    return balances;
  } catch (e) {
    console.log("Test token minting error");
    console.log(e);
  }
};

export const mintTestToken = async (network, userAddress, token) => {
  let amountString = {
    FTRG: "10000000000000000000000",
    TOTEM: "10000",
    STN: "10000000",
  }[token.symbol];
  if (!amountString) amountString = "100000000000000000000";

  const contract = new Contract(
    token.address,
    [
      "function balanceOf(address) external view returns (uint256)",
      "function mint(address,uint256) external view returns (uint256)",
      "function symbol() external view returns (string)",
    ],
    Web3Providers[network]
  );
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
};

export const claim = async (network, userAddress) => {
  if (!isAddress(userAddress)) throw new Error("Invalid address");
  let balances = await getTestTokenBalance(network, userAddress);
  await Promise.all(
    Object.entries(balances).map(([symbol, balance]) => {
      if (balance === "0") {
        return mintTestToken(network, userAddress, symbol);
      }
    })
  );
  balances = await getTestTokenBalance(network, userAddress);

  const Balancetext = Object.entries(balances).reduce(
    (acc, [key, value]) => acc + `${key}: ${value} \n`,
    ""
  );
  const fields = [
    {
      name: ``,
      value: `User: [${userAddress}](${getExplorerBaseUrlFromName(
        network
      )}address/${userAddress})`,
    },
    {
      name: "Test Token Balances",
      value: Balancetext,
    },
  ];
  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `🪂 Claim | ${network}`,
      footer: { text: new Date().toString() },
      fields: fields.slice(0, 24), // 25 item limit
    },
    channelName: "action",
  });
};
