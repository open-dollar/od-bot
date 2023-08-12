import { Network } from 'alchemy-sdk'
import { Web3Providers } from './provider'

const SUBMITTED = 'SUBMITTED'
const COMPLETE = 'COMPLETE'
const FAILED = 'FAILED'

const MINIMUM_CONFIRMATIONS = 1

export function getAlchemyNetworkEnum(network) {
  switch (network) {
    case 'MAINNET':
      return Network.ETH_MAINNET
    case 'GOERLI':
      return Network.ETH_GOERLI
    case 'SEPOLIA':
      return Network.ETH_SEPOLIA
    case 'OPTIMISM':
      return Network.OPT_MAINNET
    case 'OPTIMISM-GOERLI':
      return Network.OPT_GOERLI
    case 'ARBITRUM':
      return Network.ARB_MAINNET
    case 'ARBITRUM-GOERLI':
      return Network.ARB_GOERLI
    case 'POLYGON':
      return Network.MATIC_MAINNET
    case 'MUMBAI':
      return Network.MATIC_MUMBAI
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}

export function getNativeCoinInfo(network) {
  const NATIVE_COIN_ABBREVIATIONS = {
    MAINNET: 'ETH',
    POLYGON: 'MATIC',
    MUMBAI: 'MATIC',
    GNOSIS: 'xDAI',
    GOERLI: 'ETH',
    OPTIMISM: 'ETH',
    'OPTIMISM-GOERLI': 'ETH',
    ARBITRUM: 'ETH',
    'ARBITRUM-NOVA': 'ETH',
    SEPOLIA: 'ETH',
    AVALANCHE: 'AVAX',
    'AVALANCHE-FUJI': 'AVAX',
  }

  const NATIVE_COIN_NAMES = {
    MAINNET: 'ETH',
    POLYGON: 'MATIC',
    MUMBAI: 'Mumbai MATIC',
    GNOSIS: 'xDAI',
    GOERLI: 'Goerli ETH',
    OPTIMISM: 'Optimism ETH',
    'OPTIMISM-GOERLI': 'Optimism Goerli ETH',
    ARBITRUM: 'Arbitrum ETH',
    'ARBITRUM-NOVA': 'Arbitrum Nova ETH',
    SEPOLIA: 'Sepolia ETH',
    AVALANCHE: 'AVAX',
    'AVALANCHE-FUJI': 'Fuji AVAX',
  }

  const abbreviation = NATIVE_COIN_ABBREVIATIONS[network] || 'UNKNOWN'
  const name = NATIVE_COIN_NAMES[network] || 'Unknown Network'

  return {
    symbol: abbreviation,
    name,
  }
}

export const AVAILABLE_NETWORKS = [
  'OPTIMISM',
  'OPTIMISM-GOERLI',
  'ARBITRUM',
  'ARBITRUM-GOERLI',
]

export function getExplorerBaseUrlFromName(name) {
  if (AVAILABLE_NETWORKS.includes(name)) {
    switch (name) {
      case 'MAINNET':
        return 'https://etherscan.io/'
      case 'POLYGON':
        return 'https://polygonscan.com/'
      case 'GOERLI':
        return `https://goerli.etherscan.io/`
      case 'SEPOLIA':
        return `https://sepolia.etherscan.io/`
      case 'GNOSIS':
        return `https://blockscout.com/xdai/mainnet/`
      case 'MATIC':
        return `https://polygonscan.com/`
      case 'MUMBAI':
        return `https://mumbai.polygonscan.com/`
      case 'AVALANCHE':
        return `https://avascan.info/` // not working but on https://avascan.info/blockchain/dfk/
      case 'AVALANCHE-FUJI':
        return `https://testnet.snowtrace.io/`
      case 'ARBITRUM':
        return `https://arbiscan.io/`
      case 'OPTIMISM':
        return `https://optimistic.etherscan.io/`
      case 'OPTIMISM-GOERLI':
        return `https://goerli-optimism.etherscan.io/`
      case 'ARBITRUM-GOERLI':
        return `https://goerli.arbiscan.io/`
      case 'MANTLE-WADSLEY':
        return `https://explorer.testnet.mantle.xyz/`
    }
  } else {
    return `https://${name}.etherscan.io/`
  }
}

export function getBlockExplorerUrl(name, hash) {
  const baseUrl = getExplorerBaseUrlFromName(name)
  const url = new URL('tx/' + hash, baseUrl)
  return url.toString()
}


const getLogByTopic = ({ logs, topic }) => {
  let logByTopic = null
  logs.map((log) => {
    if (log.topics.indexOf(topic) >= 0) logByTopic = log
  })
  return logByTopic
}

export const getTxReceipt = async ({ txHash, network }) =>
  Web3Providers[network].getTransactionReceipt(txHash)

export const getTxStatus = async ({ txHash, network }) => {
  const receipt = await getTxReceipt({ network, txHash })
  if (
    receipt?.status === 0 &&
    receipt?.confirmations >= MINIMUM_CONFIRMATIONS
  ) {
    return FAILED
  } else if (
    receipt?.status == 1 &&
    receipt?.confirmations >= MINIMUM_CONFIRMATIONS
  ) {
    return COMPLETE
  }
  return SUBMITTED
}