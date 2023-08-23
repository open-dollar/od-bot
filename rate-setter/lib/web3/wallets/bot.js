import { Wallet } from '@ethersproject/wallet'

import { logger } from '../../logger'
import { checkGasAndAirdrop, getGasSettings } from '../gas'
import { Web3Providers } from '../provider'

const botWallet = process.env.BOT_WALLET_PRIVATE_KEY && new Wallet(
  process.env.BOT_WALLET_PRIVATE_KEY
)

const validateConfig = (wallet) => {
  if (!wallet) return logger.warn('Bot wallet not configured')
  if (
    wallet.address.toLowerCase() !==
    process.env.BOT_WALLET_ADDRESS.toLowerCase()
  )
    throw 'Bot wallet address and pk do not match'
}

validateConfig(botWallet)

export const botSignTx = async (unsigned) => botWallet.signTransaction(unsigned)

export const botBalance = async ({ network }) =>
  Web3Providers[network].getBalance(botWallet.address)

export const botSendTx = async ({ unsigned, network }) => {
  try {
    await checkGasAndAirdrop({ network, address: botWallet.address, network })
    const botWalletWithProvider = botWallet.connect(Web3Providers[network])
    const gasSettings = await getGasSettings({ network })
    return await botWalletWithProvider.sendTransaction({
      ...unsigned,
      ...gasSettings,
    })
    return null
  } catch (e) {
    logger.error(e)
    throw new Error(`botSendTransaction() ${e}`)
  }
}
