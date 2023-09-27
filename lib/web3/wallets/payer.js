import { Wallet } from "@ethersproject/wallet";

import { logger } from "../../logger";
import { getGasSettings } from "../gas";
import { Web3Providers } from "../provider";

const payerWallet =
  process.env.PAYER_WALLET_PRIVATE_KEY &&
  new Wallet(process.env.PAYER_WALLET_PRIVATE_KEY);

const validateConfig = (wallet) => {
  if (
    wallet.address.toLowerCase() !==
    process.env.PAYER_WALLET_ADDRESS.toLowerCase()
  )
    throw "Payer wallet address and pk do not match";
};

export const payerSendTransaction = async ({ unsigned, network }) => {
  if (!payerWallet.address) return logger.warn("Payer wallet not configured");
  validateConfig(payerWallet);
  try {
    const payerWalletWithProvider = payerWallet.connect(Web3Providers[network]);
    const gasSettings = await getGasSettings({
      unsignedTx: unsigned,
      provider: payerWalletWithProvider,
    });
    return await payerWalletWithProvider.sendTransaction({
      ...unsigned,
      ...gasSettings,
    });
  } catch (e) {
    logger.error(e);
    throw new Error(`payerSendTransaction() ${e}`);
  }
};

export const payerAddress = payerWallet?.address;
