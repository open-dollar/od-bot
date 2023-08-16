import { defaultAbiCoder } from '@ethersproject/abi'

import { initGeb } from "../geb"
import {
    multiplyWad,
    formatDataNumber, transformToWadPercentage, transformToEightHourlyRate,
    transformToAnnualRate, multiplyRates
} from '../common'
import { sendAlert } from '../../discord/alert'
import VirtualAnalyticsData from './VirtualAnalyticsData.json'

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

    // Global analytics
    const fields = Object.entries(parsed).filter(([key]) => key !== 'tokenAnalyticsData').map(([key, value]) => ({
        name: key, value: value.toString(), inline: true
    })).slice(0, 24) // 25 item limit

    await sendAlert({
        embed: {
            color: 0xffffd0,
            title: `📊  Analytics | ${network}`,
            footer: { text: new Date().toString() },
            fields
        },
        channelName: 'action',
    })

    // Collateral analytics
    // let collateralFields  = []
    // Object.entries(parsed.tokenAnalyticsData).map(([key, value]) => {
    //     Object.entries(value).map(([key, value]) => {
    //         collateralFields.push({
    //             name: value.symbol, value: "foo", inline: true
    //         })
    //     })
    // })

    // await sendAlert({
    //     embed: {
    //         color: 0xffffd0,
    //         title: `📊  Analytics | ${network}`,
    //         footer: { text: new Date().toString() },
    //         fields: collateralFields.slice(0, 24)  // 25 item limit
    //     },
    //     channelName: 'action',
    // })
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
