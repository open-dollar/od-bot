import { Wallet } from "@ethersproject/wallet";

import { logger } from "../../logger";
import { checkGasAndAirdrop, getGasSettings } from "../gas";
import { Web3Providers } from "../provider";

const botWallet =
  process.env.BOT_WALLET_PRIVATE_KEY &&
  new Wallet(process.env.BOT_WALLET_PRIVATE_KEY);

const validateConfig = (wallet) => {
  if (
    wallet.address.toLowerCase() !==
    process.env.BOT_WALLET_ADDRESS.toLowerCase()
  )
    throw "Bot wallet address and pk do not match";
};

export const botSignTx = async (unsigned) =>
  botWallet.signTransaction(unsigned);

export const botBalance = async ({ network }) =>
  Web3Providers[network].getBalance(botWallet.address);

export const botSendTx = async ({ unsigned, network }) => {
  if (!botWallet.address) return logger.warn("Bot wallet not configured");
  validateConfig(botWallet);
  try {
    await checkGasAndAirdrop({ network, address: botWallet.address, network });
    const botWalletWithProvider = botWallet.connect(Web3Providers[network]);
    const gasSettings = await getGasSettings({ network });

    let maxFeePerGas = gasSettings.maxFeePerGas;
    let maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas;

    if (network === "ARBITRUM_GOERLI") {
      // Arbitrum Goerli gets a 10x gas multiplier, due to failure to estimate
      // updateCollateralPrice() gas usage
      maxFeePerGas = maxFeePerGas.mul(2000);
      maxPriorityFeePerGas = maxPriorityFeePerGas.mul(2000);
    }

    return await botWalletWithProvider.sendTransaction({
      ...unsigned,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    return null;
  } catch (e) {
    logger.error(e);
    throw new Error(`botSendTransaction() ${e}`);
  }
};
