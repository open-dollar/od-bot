import { parseEther, formatEther } from "@ethersproject/units";

import { getNativeCoinInfo, getExplorerBaseUrlFromName } from "../common";
import { sendAlert } from "../../discord/alert";
import { logger } from "../../logger";
import { gasConfigByNetwork } from "./gasConfig";
import { Web3Providers } from "../provider";
import { payerAddress, payerSendTransaction } from "../wallets/payer";

export const getGasBalance = async ({ address, network }) => {
  const balanceBn = await Web3Providers[network].getBalance(address);
  const nativeCoinInfo = getNativeCoinInfo(network);
  return {
    balance: balanceBn.toString(),
    balanceBn: balanceBn,
    formatted: formatEther(balanceBn),
    decimals: 18,
    symbol: nativeCoinInfo.symbol,
    name: nativeCoinInfo.name,
    tokenAddress: null,
    network,
    chainId: Web3Providers[network]._network.chainId,
  };
};

export const checkGasAndAirdrop = async ({ address, amount, network }) => {
  try {
    const recipientAddress = address;
    const { balanceBn: balance } = await getGasBalance({
      address: recipientAddress,
      network,
    });
    const { balanceBn: payerBalance } = await getGasBalance({
      address: payerAddress,
      network,
    });
    const GAS_CONFIG = gasConfigByNetwork({ network });
    let dropAmount = GAS_CONFIG.DEFAULT_DROP_AMOUNT;
    if (balance.isZero()) dropAmount = GAS_CONFIG.INITIAL_DROP_AMOUNT;
    if (amount) dropAmount = amount;
    logger.debug(
      `checkGasAndAirdrop() recipientAddress: \n${recipientAddress}`
    );
    logger.debug(`checkGasAndAirdrop() balance: \n${balance}`);
    logger.debug(
      `checkGasAndAirdrop() parseEther(GAS_CONFIG.MINIMUM_GAS_DROP_THRESHOLD): \n${parseEther(
        GAS_CONFIG.MINIMUM_GAS_DROP_THRESHOLD
      )}`
    );

    if (balance.lte(parseEther(GAS_CONFIG.MINIMUM_GAS_DROP_THRESHOLD))) {
      logger.debug("⛽️⛽️⛽️ Airdrop threshold met, sending gas");
      const tx = await payerSendTransaction({
        unsigned: {
          to: recipientAddress,
          value: parseEther(dropAmount),
        },
        network,
      });

      await notifyDiscord({
        address: recipientAddress,
        network,
        txHash: tx.hash,
        payerBalance: formatEther(payerBalance),
      });
      return tx;
    }
    return null;
  } catch (e) {
    logger.log(e);
    logger.error(`⛽️  Airdrop 🚫 FAILED | ${network}`);
    await sendAlert({
      embed: {
        color: 15548997,
        title: `⛽️  Airdrop 🚫 FAILED | ${network}`,
        description: `${getExplorerBaseUrlFromName(
          network
        )}address/${payerAddress}`,
        footer: { text: new Date().toString() },
      },
      channelName: "warning",
    });
  }
};

export const getGasSettings = async ({ unsignedTx, provider }) => {
  // Estimate gas required
  let gasUnits = await provider.estimateGas({ ...unsignedTx });
  const gasUnitsPadded = gasUnits.mul(200).div(100); // add 50% for safety

  // Current gas price
  const gasPrice = await provider.getGasPrice();
  const txFee = gasUnitsPadded.mul(gasPrice);

  // Check gas balance
  const signerBalance = await provider.getBalance();
  if (signerBalance.lt(txFee)) {
    throw Error(`Insufficient gas balance`);
  }

  // Fee settings
  const feeData = await provider.getFeeData();
  const { maxFeePerGas, maxPriorityFeePerGas } = feeData;
  return { maxFeePerGas, maxPriorityFeePerGas, gasLimit: gasUnitsPadded };
};

const notifyDiscord = async ({ address, txHash, payerBalance, network }) => {
  try {
    await sendAlert({
      embed: {
        color: 15924992,
        title: `⛽️  Airdrop Success | ${network}`,
        description: `Address: ${address}
${getExplorerBaseUrlFromName(network)}tx/${txHash}

Airdropper balance: **${payerBalance}** ETH`,
        footer: { text: new Date().toString() },
      },
      channelName: "action",
    });
  } catch (e) {
    logger.error(e);
  }
};
