import { Alchemy } from 'alchemy-sdk'
import { BigNumber } from 'alchemy-sdk'
import axios from 'axios'

import { DEFAULT_GAS_MAX_PRIORITY_FEE_PER_GAS } from '../provider'

import { parseEther, formatEther } from '@ethersproject/units'

import { getNativeCoinInfo, getAlchemyNetworkEnum, getExplorerBaseUrlFromName } from '../common'
import { sendAlert } from '../../discord/alert'
import { logger } from '../../logger'
import { gasConfigByNetwork } from './gasConfig'
import { Web3Providers } from '../provider'
import { payerAddress, payerSendTransaction } from '../wallets/payer'

export const airdropGasTransaction = async ({ address, amount, network }) => {
  try {
    const tx = {
      to: address,
      value: parseEther(amount),
    }
    return await payerSendTransaction({ unsigned: tx, network })
  } catch (e) {
    logger.error(e?.message || e)
    Sentry.captureException(e)
    throw new Error('airdropGasTransaction() ', e?.message || e)
  }
}

export const getGasBalance = async ({ address, network }) => {
  const balanceBn = await Web3Providers[network].getBalance(address)
  const nativeCoinInfo = getNativeCoinInfo(network)
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
  }
}

export const checkGasAndAirdrop = async ({ address, amount, network }) => {
  try {
    const recipientAddress = address
    const { balanceBn: balance } = await getGasBalance({
      address: recipientAddress,
      network,
    })
    const { balanceBn: payerBalance } = await getGasBalance({
      address: payerAddress,
      network,
    })
    const GAS_CONFIG = gasConfigByNetwork({ network })
    let dropAmount = GAS_CONFIG.DEFAULT_DROP_AMOUNT
    if (balance.isZero()) dropAmount = GAS_CONFIG.INITIAL_DROP_AMOUNT
    if (amount) dropAmount = amount
    logger.debug(`checkGasAndAirdrop() recipientAddress: ${recipientAddress}`)
    logger.debug(`checkGasAndAirdrop() balance \n${balance}`)
    logger.debug(
      `checkGasAndAirdrop() parseEther(GAS_CONFIG.MINIMUM_GAS_DROP_THRESHOLD): \n${parseEther(
        GAS_CONFIG.MINIMUM_GAS_DROP_THRESHOLD
      )}`
    )

    if (balance.lte(parseEther(GAS_CONFIG.MINIMUM_GAS_DROP_THRESHOLD))) {
      logger.debug("Airdrop threshold met, sending gas")
      const tx = await airdropGasTransaction({
        address: recipientAddress,
        amount: dropAmount,
        network,
      })
      await notifyDiscord({
        address: recipientAddress,
        network,
        txHash: tx.hash,
        payerBalance: formatEther(payerBalance),
      })
      return tx
    }
    return null
  } catch (e) {
    logger.log(e)
    logger.error(`🪂 Airdrop 🚫 FAILED | ${network}`)
    await sendAlert({
      embed: {
        color: 15548997,
        title: `🪂 Airdrop 🚫 FAILED | ${network}`,
        description: `${getExplorerBaseUrlFromName(
          network
        )}address/${payerAddress}`,
        footer: { text: new Date().toString() },
      },
      channelName: 'warning',
    })
  }
}

export const getGasSettings = async ({ network }) => {
  let alchemyNetwork
  try {
    alchemyNetwork = getAlchemyNetworkEnum(network)
  } catch (e) {
    logger.debug(`getGasSettings() - no Alchemy network found for ${network}`)

  }
  let maxFeePerGas
  let maxPriorityFeePerGas

  // Use Alchemy first, if available for the network
  if (alchemyNetwork) {
    try {
      const settings = {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: getAlchemyNetworkEnum(network),
      }
      const alchemy = new Alchemy(settings)
      let gasPrice = await alchemy.core.getGasPrice()
      maxFeePerGas = gasPrice
      maxPriorityFeePerGas = gasPrice
    } catch (e) {
      if (network === 'POLYGON') {
        maxFeePerGas = DEFAULT_GAS_MAX_PRIORITY_FEE_PER_GAS
        maxPriorityFeePerGas = DEFAULT_GAS_MAX_PRIORITY_FEE_PER_GAS
        logger.error(`Falling back to default gas settings for Polygon`)
      }
      logger.error(`Can't get gas settings from Alchemy for ${network}`)
      logger.error(e)
    }
  }

  // Using Infura for Avalanche and Avalanche-Fuji
  if (network === 'AVALANCHE' || network === 'AVALANCHE-FUJI') {
    try {
      if (network === 'AVALANCHE') {
        axios
          .post(
            `https://avalanche-mainnet.infura.io/v3/${process.env.INFURA_ID}`,
            {
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_gasPrice',
              params: [],
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          )
          .then(
            (response) => {
              maxFeePerGas = response.data.result
              maxPriorityFeePerGas = response.data.result
            },
            (error) => {
              logger.error(`Can't get gas settings from Infura for ${network}`)
              logger.error(error)
            }
          )
      } else {
        axios
          .post(
            `https://avalanche-fuji.infura.io/v3/${process.env.INFURA_ID}`,
            {
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_gasPrice',
              params: [],
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          )
          .then(
            (response) => {
              maxFeePerGas = response.data.result
              maxPriorityFeePerGas = response.data.result
            },
            (error) => {
              logger.error(`Can't get gas settings from Infura for ${network}`)
              logger.error(error)
            }
          )
      }
    } catch (e) {
      logger.error(`Can't get gas settings from Infura for ${network}`)
      logger.error(e)
    }
  }

  // Gnosis
  if (network === 'GNOSIS') {
    try {
      let response = await axios.get(
        'https://api.gnosisscan.io/api?module=proxy&action=eth_gasPrice'
      )
      let gasPrice = response.data.result
      maxFeePerGas = BigNumber.from(gasPrice)
      maxPriorityFeePerGas = maxFeePerGas
    } catch (e) {
      logger.error(`Can't get gas settings for Gnosis`)
      logger.error(e)
    }
  }

  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    maxFeePerGas = undefined
    maxPriorityFeePerGas = undefined
  }

  return { maxFeePerGas, maxPriorityFeePerGas }
}

const notifyDiscord = async ({ address, txHash, payerBalance, network }) => {
  try {
    await sendAlert({
      embed: {
        color: 15924992,
        title: `🪂 Airdrop 🪙 Success | ${network}`,
        description: `Address: ${address}
${getExplorerBaseUrlFromName(network)}tx/${txHash}

Payer balance: **${payerBalance}**`,
        footer: { text: new Date().toString() },
      },
      channelName: 'action',
    })
  } catch (e) {
    logger.error(e)
  }
}