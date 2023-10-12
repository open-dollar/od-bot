import { initGeb } from "./geb";
import { Contract } from "@ethersproject/contracts";
import { isAddress } from "@ethersproject/address";
import { sendAlert } from "../discord/alert";
import { formatEther } from "@ethersproject/units";

import { prepareTx } from "./common";
import { botSendTx } from "./wallets/bot";
import { Web3Providers } from "./provider";
import { getExplorerBaseUrlFromName, formatDataNumber } from "./common";
import { checkGasAndAirdrop } from "./gas";

const getMintableTokens = (network) => {
  const geb = initGeb(network);
  return Object.values(geb.tokenList).filter((token) =>
    ["WSTETH", "CBETH", "RETH", "ARB", "MAGIC"].includes(token.symbol)
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
        [
          "function balanceOf(address) external view returns (uint256)",
          "function decimals() external view returns (uint256)",
        ],
        Web3Providers[network]
      );
      const balanceOf = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      balances[token.symbol] = formatDataNumber(
        balanceOf.toString() || "0",
        decimals.toString(),
        2,
        false,
        true
      );
    }
    return balances;
  } catch (e) {
    console.log("Test token minting error");
    console.log(e);
  }
};

export const mintTestToken = async (network, userAddress, token) => {
  let amountString = {
    ARB: "100",
    WSTETH: "10000000000",
    CBETH: "10000000000",
    RETH: "100000",
    MAGIC: "100",
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
  let mintedTokens = false;
  const tokenList = getMintableTokens(network);

  for (let i = 0; i < Object.entries(balances).length; i++) {
    const [symbol, balance] = Object.entries(balances)[i];
    if (balance === "0") {
      mintedTokens = true;
      const token = tokenList.find((token) => token.symbol === symbol);
      await mintTestToken(network, userAddress, token);
    }
  }

  balances = await getTestTokenBalance(network, userAddress);

  await checkGasAndAirdrop({ network, address: userAddress });
  const geb = initGeb(network);
  const balanceBn = await geb.provider.getBalance(userAddress);

  let balanceText = Object.entries(balances).reduce(
    (acc, [key, value]) => acc + `${value} ${key}\n`,
    ""
  );
  let fields = [
    {
      name: ``,
      value: `User: [${userAddress}](${getExplorerBaseUrlFromName(
        network
      )}address/${userAddress})`,
    },
    {
      name: "Collateral Balances",
      value: balanceText,
    },
    {
      name: "Gas Balance",
      value: `${formatEther(balanceBn)} ETH`,
    },
  ];
  if (mintedTokens) {
    fields.push({
      value: "Test Tokens Minted!",
      name: "Return to the app to open a new vault",
    });
  }
  await sendAlert({
    embed: {
      color: 0xffffd0,
      title: `🪂  Claim Success | ${network}`,
      footer: { text: new Date().toString() },
      fields: fields.slice(0, 24), // 25 item limit
    },
    channelName: "action",
  });
};
