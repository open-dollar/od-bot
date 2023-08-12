import { JsonRpcProvider, InfuraProvider } from '@ethersproject/providers'
import { parseUnits } from '@ethersproject/units'
import { AVAILABLE_NETWORKS } from './common'

import { logger } from '../logger'

export const DEFAULT_GAS_MAX_PRIORITY_FEE_PER_GAS = parseUnits('2', 'gwei')
export const DEFAULT_GAS_MAX_FEE_PER_GAS = parseUnits('10', 'gwei')

const RPC_BY_NAME = {
  MAINNET: process.env.RPC_MAINNET,
  POLYGON: process.env.RPC_POLYGON,
  MUMBAI: process.env.RPC_MUMBAI,
  GNOSIS: process.env.RPC_GNOSIS,
  GOERLI: process.env.RPC_GOERLI,
  OPTIMISM: process.env.RPC_OPTIMISM,
  'OPTIMISM-GOERLI': process.env.RPC_OPTIMISM_GOERLI,
  ARBITRUM: process.env.RPC_ARBITRUM,
  'ARBITRUM-GOERLI': process.env.RPC_ARBITRUM_GOERLI,
  SEPOLIA: process.env.RPC_SEPOLIA,
  AVALANCHE: process.env.RPC_AVALANCHE,
  'AVALANCHE-FUJI': process.env.RPC_AVALANCHE_FUJI,
  'MANTLE-WADSLEY': process.env.RPC_MANTLE_WADSLEY,
}

const getProviderByName = (name) => {
  try {
    let provider
    if (name === 'MAINNET') {
      provider = new InfuraProvider(name, process.env.INFURA_ID)
    } else {
      provider = new JsonRpcProvider(RPC_BY_NAME[name])
    }
    if (provider.connection.url === 'http://localhost:8545')
      throw 'No RPC URL provided'
    return provider
  } catch (error) {
    logger.error(`Error getting web3 provider for ${name}: ${error}`)
    return null
    // throw new Error(error)
  }
}

let providers = {}
AVAILABLE_NETWORKS.map((name) => {
  const provider = getProviderByName(name)
  if (provider) providers[name] = provider
})

logger.debug(`Available providers: ${Object.keys(providers)}`)

export const Web3Providers = providers
