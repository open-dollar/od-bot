import { Geb } from '@usekeyp/od-sdk'

import prisma from '../prisma'
import { botSendTx } from "./wallets/bot"
import { Web3Providers } from './provider'
import { sendAlert } from '../discord/alert'
import {
    getExplorerBaseUrlFromName,
} from './common'

import { readMany, prepareTx } from "./common"
import path from 'path'

// dev logging
import fs from 'fs';

export const initGeb = (network) => {
    const provider = Web3Providers[network]
    const networkMap = (network) => {
        if (network === "OPTIMISM_GOERLI") return "optimism-goerli"
        if (network === "ARBITRUM_GOERLI") return "arbitrum-goerli"
        return network.toLowerCase()
    }
    return new Geb(networkMap(network), provider)
}

export const setupProxy = async (network) => {
    const geb = initGeb(network)
    try {
        proxy = await geb.getProxyAction(wallet.address)
        const proxyAddress = proxy.proxyAddress
        console.log(`DSProxy exists for this wallet: ${proxyAddress}`)
    } catch (e) {
        try {
            console.log('No DSProxy found, creating one...')
            const txData = await geb.contracts.proxyRegistry.populateTransaction['build()']()
            const txResponse = await botSendTx({ unsigned: txData, network })
            console.log(`Transaction ${txResponse.hash} waiting to be mined...`)
            await txResponse.wait()
            console.log('Transaction mined, proxy created!')
        } catch (e) {
            console.log("DSProxy deployment error")
            console.log(e)
        }
    }
}

export const rateSetterIsReady = async (network) => {
    const geb = initGeb(network)

    const updateRateDelay = (await geb.contracts.rateSetter.params()).updateRateDelay.toNumber()
    let lastUpdateTime = (await geb.contracts.rateSetter.lastUpdateTime()).toNumber()
    const blockTimestamp = (await geb.provider.getBlock()).timestamp
    const nextUpdateTime = new Date((lastUpdateTime + updateRateDelay) * 1000)

    if (blockTimestamp - lastUpdateTime < updateRateDelay) {
        await sendAlert({
            embed: {
                color: 7452131,
                title: `📈  RateSetter Cooldown ❄️ Cooling | ${network}`,
                description: `Last - ${new Date(lastUpdateTime * 1000).toString()}
Next - ${nextUpdateTime.toString()}`,
                footer: { text: new Date().toString() },
            },
            channelName: 'action',
        })
        return false
    } else {
        await sendAlert({
            embed: {
                color: 7452131,
                title: `📈  RateSetter Cooldown 🟢 Ready | ${network}`,
                description: `Last - ${new Date(lastUpdateTime * 1000).toString()}`,
                footer: { text: new Date().toString() },
            },
            channelName: 'action',
        })
        return true
    }
}

export const updateStats = async ({ network, stats }) => {
    try {
        await prisma.stats.create({
            data: {
                network,
                redemptionPrice: stats.lastRedemptionPrice.toString(),
                redemptionRate: stats.redemptionRate.toString(),
                lastUpdateTime: stats.lastUpdateTime,
                blockTimestamp: stats.blockTimestamp,
            },
        })
    } catch (e) {
        await sendAlert({
            embed: {
                color: 15548997,
                title: `📡 Database update 🚫 FAILED | ${network}`,
                description: `updateStats() failed with error: ${e}`,
                footer: { text: new Date().toString() },
            },
            channelName: 'warning',
        })
    }
}

export const getStats = async (network) => {
    const geb = initGeb(network)
    const { oracleRelayer } = geb.contracts

    let stats
    stats = await readMany([
        "lastRedemptionPrice",
        "marketPrice",
        "redemptionRate",
        "redemptionPriceUpdateTime"
    ], oracleRelayer)
    stats.lastUpdateTime = new Date((stats.lastUpdateTime).toNumber() * 1000)

    stats.redemptionRateUpperBound = await oracleRelayer.redemptionRateUpperBound()
    stats.redemptionRateLowerBound = await oracleRelayer.redemptionRateLowerBound()

    stats.blockTimestamp = (await geb.provider.getBlock()).timestamp

    return stats
}

export const getCollateralStats = async (network) => {
    const stats = await OracleRelayerCParams(network)
    // stats.map((collateral) => {
    //     collateral.
    // })
    // TODO: get more info about each collateral
    // calculate safePrice
    // calculate liquidationPrice
    console.log(stats)
    return stats
}

// Returns safetyCRatio, liquidationCRatio, and IDelayedOracle for each collateral
export const OracleRelayerCParams = async (network) => {
    const geb = initGeb(network)
    const { oracleRelayer } = geb.contracts
    const collateralList = await geb.contracts.collateralList()
    let stats
    await Promise.all(collateralList.map(async (cType) => {
        stats[cType] = await oracleRelayer.cParams[cType]
    }))
    return stats
}

export const useLiquidateSAFE = async (network, safeAddress) => {
    const geb = initGeb(network)
    const ready = await rateSetterIsReady(network)

    if (ready) {
        const geb = initGeb(network)
        // test when safe addresses are known
        const txData = await geb.contracts.liquidationEngine.liquidateSAFE(utils.WETH, safeAddress);
        const txResponse = await wallet.sendTransation(txData)
        console.log(`Transaction ${txResponse.hash} waiting to be mined...`)
        await txResponse.wait()
    }
}

export const getAuctionsList = async (tokenSymbol, blockNumber, network = 'OPTIMISM_GOERLI') => {
    try {
        const geb = initGeb(network);

        const collateralAuctionsFetched = await geb.auctions.getCollateralAuctions(Number(blockNumber), tokenSymbol || 'WETH');

        return collateralAuctionsFetched;

    } catch (error) {
        console.error('Error while using getCollateralAuctions:', error.message);

        // return or throw an error response based on your requirements
        throw new Error('Failed to use getCollateralAuctions.');
    }
};

// glboal debt
export const getGlobalDebt = async (network = 'OPTIMISM_GOERLI') => {
    try {
        const geb = initGeb(network);

        const bigNumberValue = await geb.contracts.safeEngine.globalDebt();
        return utils.formatUnits(bigNumberValue, 18);

    } catch (error) {
        console.error('Error while using getGlobalDebt:', error.message);
    }
};

// helper for logging Geb info
export const logGebInfo = async () => {
    try {
        const geb = initGeb(network);

        // Convert the geb object to a string
        const data = JSON.stringify(geb.auctions, null, 4);  // The third parameter (4) is for pretty-printing

        // Write to a file
        const filePath = path.join(process.cwd(), '/logs/geb_auctions.json'); // Adjust path as needed
        fs.writeFileSync(filePath, data);

        console.log('Geb object written to:', filePath);

        // return a success response, or the data, or filePath, based on your requirements
        return { status: 'success', filePath };
    } catch (error) {
        console.error('Error while fetching and writing Geb data:', error.message);

        // return or throw an error response based on your requirements
        throw new Error('Failed to fetch and write Geb data.');
    }
};
