import { Geb, utils } from '@usekeyp/od-sdk'

import { botSendTx } from "./wallets/bot"
import { Web3Providers } from './provider'
import { sendAlert } from '../discord/alert'
import { getExplorerBaseUrlFromName } from './common'
import { prepareTx } from "./common"

import { initGeb } from "./geb"

export const updateFeed = async (network, address) => {
  const geb = initGeb(network)
  // TODO: Use address to fetch the right Oracle
  const { oracleRelayer } = geb.contracts

  const shouldUpdate = await DelayedOracle.shouldUpdate()
  if (shouldUpdate) {
    const txData = await DelayedOracle.updateResult()
    const tx = await prepareTx({ data: txData }) // Updates the db with the unsigned tx
    const txResponse = await botSendTx({ unsigned: txData, network })
    await updateTx(tx, { hash: txResponse.hash })

    await sendAlert({
      embed: {
        color: 1900316,
        title: `📈 DelayedOracle 🔃 UPDATED | ${network}`,
        description: `${getExplorerBaseUrlFromName(
          network
        )}tx/${txResponse.hash}

${JSON.toString(stats)}`,
        footer: { text: new Date().toString() },
      },
      channelName: 'action',
    })

    return success
  }
}

export const getOracleDetails = async () => {
  let details = await readManyVars([
    "shouldUpdate",
    "getResultWithValidity"
  ], DelayedOracle)

  details.priceFeedValue = details.resultWithValidity.result
  details.priceFeedValidity = details.resultWithValidity.validity

  // shouldUpdate, priceFeedValue, priceFeedValidity
  return details
}
