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
    await checkGasAndAirdrop({ address: botWallet.address, network });
    const botWalletWithProvider = botWallet.connect(Web3Providers[network]);
    const gasSettings = await getGasSettings({
      unsignedTx: unsigned,
      provider: botWalletWithProvider,
    });

    return await botWalletWithProvider.sendTransaction({
      ...unsigned,
      ...gasSettings,
    });
    return null;
  } catch (e) {
    logger.error(e);
    throw new Error(`botSendTransaction() ${e}`);
  }
};
