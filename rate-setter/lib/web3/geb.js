import { Geb, utils } from '@usekeyp/od-sdk'
import { defaultAbiCoder } from '@ethersproject/abi'

import prisma from '../prisma'
import { botSendTx } from "./wallets/bot"
import { Web3Providers } from './provider'
import { sendAlert } from '../discord/alert'
import {
    getExplorerBaseUrlFromName, multiplyWad,
    formatDataNumber, transformToWadPercentage, transformToEightHourlyRate,
    transformToAnnualRate, multiplyRates
} from './common'
import { getTokenList } from '@usekeyp/od-sdk/lib/contracts/addreses'
import VirtualAnalyticsData from './VirtualAnalyticsData.json'

import { readMany } from "./common"
import { parse } from 'path'

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

export const updateRate = async (network) => {
    const geb = initGeb(network)
    const ready = await rateSetterIsReady(network)

    if (ready) {
        const geb = initGeb(network)
        const txData = await geb.contracts.rateSetter.populateTransaction.updateRate()
        const txResponse = await botSendTx({ unsigned: { to: geb.contracts.rateSetter.address, ...txData }, network })
        console.log(`Transaction ${txResponse.hash} waiting to be mined...`)
        await txResponse.wait()

        const stats = await getStats(network)
        await updateStats({ network, stats })

        await sendAlert({
            embed: {
                color: 1900316,
                title: `📈 RateSetter 🔃 UPDATED | ${network}`,
                description: `${getExplorerBaseUrlFromName(
                    network
                )}tx/${txResponse.hash}

${JSON.toString(stats)}`,
                footer: { text: new Date().toString() },
            },
            channelName: 'action',
        })
        console.log('Transaction mined, rate set!')
    }
}


export const getAnalytics = async (network) => {
    // Get raw data using virtualAnalytcisData contract
    const analyticsData = await fetchAnalyticsData(network)
    // console.log(analyticsData)

    // Parse to human read-able
    const geb = initGeb(network)
    const parsed = {
        erc20Supply: formatDataNumber(analyticsData.erc20Supply, 18, 0, true),
        globalDebt: formatDataNumber(analyticsData.globalDebt, 18, 0, true),
        globalDebtCeiling: formatDataNumber(analyticsData.globalDebtCeiling, 18, 0, true),
        globalDebtUtilization: transformToWadPercentage(analyticsData.globalDebt, analyticsData.globalDebtCeiling),
        surplusInTreasury: formatDataNumber(analyticsData.surplusInTreasury, 18, 0, true),
        marketPrice: formatDataNumber(analyticsData.marketPrice, 18, 3, true),
        redemptionPrice: formatDataNumber(analyticsData.redemptionPrice, 18, 3, true),
        annualRate: transformToAnnualRate(analyticsData.redemptionRate, 27),
        eightRate: transformToEightHourlyRate(analyticsData.redemptionRate, 27),
        pRate: transformToAnnualRate(analyticsData.redemptionRatePTerm, 27),
        iRate: transformToAnnualRate(analyticsData.redemptionRateITerm, 27),
    }
    parsed.tokenAnalyticsData =
        Object.entries(analyticsData.tokenAnalyticsData).map(([key, value], index) => ({
            [key]: {
                symbol: key, // Symbol
                address: geb.tokenList[key].address,
                delayedOracle: value?.delayedOracle,
                currentPrice: formatDataNumber(value?.currentPrice?.toString() || '0', 18, 2, true),
                nextPrice: formatDataNumber(value?.nextPrice?.toString() || '0', 18, 2, true), // Next price
                stabilityFee: transformToAnnualRate(value?.stabilityFee?.toString() || '0', 27), // Stability fee
                borrowRate: transformToAnnualRate(
                    multiplyRates(value?.stabilityFee?.toString(), analyticsData.redemptionRate?.toString()) ||
                    '0',
                    27
                ), // Borrow rate
                debt: formatDataNumber(value?.debtAmount?.toString() || '0', 18, 2, true, true), // Debt Amount
                debtUtilization: transformToWadPercentage(value?.debtAmount?.toString(), value?.debtCeiling?.toString()), // Debt Utilization
                locked: formatDataNumber(value?.lockedAmount?.toString() || '0', 18, 2, false, true), // Amount locked
                lockedUSD: formatDataNumber(
                    multiplyWad(value?.lockedAmount?.toString(), value?.currentPrice?.toString()) || '0',
                    18,
                    2,
                    true,
                    true
                ), // Amount locked in USD
                debtUtilizationRatio: transformToWadPercentage(
                    multiplyWad(value?.debtAmount?.toString(), analyticsData?.redemptionPrice?.toString()),
                    multiplyWad(value?.lockedAmount?.toString(), value?.currentPrice?.toString())
                ), // Debt amount / locked amount in USD
            }
        }))
    console.log(parsed)
}

const fetchAnalyticsData = async (network) => {
    const geb = initGeb(network)
    // Encoded input data to be sent to the batch contract constructor
    const tokenList = Object.values(geb.tokenList)
        .map((token) => token.bytes32String)
        .filter((address) => address !== undefined && address !== '' && address)

    const inputData = defaultAbiCoder.encode(
        ['address', 'address', 'address', 'address', 'address', 'address', 'bytes32[]'],
        [
            geb.contracts.systemCoin.address,
            geb.contracts.safeEngine.address,
            geb.contracts.oracleRelayer.address,
            geb.contracts.piCalculator.address,
            geb.contracts.taxCollector.address,
            geb.contracts.stabilityFeeTreasury.address,
            tokenList,
        ]
    )

    // Generate payload from input data
    const payload = VirtualAnalyticsData.bytecode.concat(inputData.slice(2))

    // Call the deployment transaction with the payload
    const returnedData = await geb.provider.call({ data: payload })

    // Parse the returned value to the struct type in order
    const decoded = defaultAbiCoder.decode(
        [
            `tuple(
                uint256 erc20Supply,
                uint256 globalDebt,
                uint256 globalDebtCeiling,
                uint256 globalUnbackedDebt,
                uint256 marketPrice, 
                uint256 redemptionPrice, 
                uint256 redemptionRate, 
                uint256 redemptionRatePTerm, 
                uint256 redemptionRateITerm, 
                uint256 surplusInTreasury, 
                tuple(
                    address delayedOracle, 
                    uint256 debtAmount, 
                    uint256 debtCeiling, 
                    uint256 lockedAmount,
                    uint256 currentPrice, 
                    uint256 nextPrice,
                    uint256 stabilityFee
                    )[] tokenAnalyticsData)`,
        ],
        returnedData
    )[0]

    const result = Object.entries(geb.tokenList)
        .filter(([, value]) => value.isCollateral)
        .reduce(
            (obj, [key], i) => ({
                ...obj,
                [key]: {
                    delayedOracle: decoded?.tokenAnalyticsData[i]?.delayedOracle,
                    debtAmount: decoded?.tokenAnalyticsData[i]?.debtAmount.toString(),
                    debtCeiling: decoded?.tokenAnalyticsData[i]?.debtCeiling.toString(),
                    lockedAmount: decoded?.tokenAnalyticsData[i]?.lockedAmount.toString(),
                    currentPrice: decoded?.tokenAnalyticsData[i]?.currentPrice.toString(),
                    nextPrice: decoded?.tokenAnalyticsData[i]?.nextPrice.toString(),
                    stabilityFee: decoded?.tokenAnalyticsData[i]?.stabilityFee.toString(),
                },
            }),
            {}
        )

    const parsedResult = {
        erc20Supply: decoded.erc20Supply.toString(),
        globalDebt: decoded.globalDebt.toString(),
        globalDebtCeiling: decoded.globalDebtCeiling.toString(),
        globalUnbackedDebt: decoded.globalUnbackedDebt.toString(),
        marketPrice: decoded.marketPrice.toString(),
        redemptionPrice: decoded.redemptionPrice.toString(),
        redemptionRate: decoded.redemptionRate.toString(),
        redemptionRatePTerm: decoded.redemptionRatePTerm.toString(),
        redemptionRateITerm: decoded.redemptionRateITerm.toString(),
        surplusInTreasury: decoded.surplusInTreasury.toString(),
        tokenAnalyticsData: result,
    }

    return parsedResult
}
