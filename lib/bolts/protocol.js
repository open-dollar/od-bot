import { getVaults } from "../vaults"
import { fetchAnalyticsData } from "@opendollar/sdk/lib/virtual/virtualAnalyticsData"

import { fetchUserSafes } from '@opendollar/sdk/lib/virtual/virtualUserSafes.js'

import { initGeb } from "../web3/geb"
import { formatUnits } from "@ethersproject/units"
import { initOracle } from "../web3/oracle"
import { giveBolts } from "./bolts"

const ARBITRUM = "ARBITRUM"
const MAINNET_CHAINLINK_ETH_USD_RELAYER = "0x3e6C1621f674da311E57646007fBfAd857084383";

const DEPOSIT_CAMPAIGN_EVENT = 'COLLATERAL_DEPOSIT'
const BORROW_CAMPAIGN_EVENT = 'DEBT_BORRROW'

const geb = initGeb(ARBITRUM)

const getTypeFromBytes = (bytes) => {
    const token = Object.values(geb.tokenList)
        .filter((token) => token.isCollateral)
        .find((token) => token.bytes32String === bytes)
    if (!token) throw new Error('Token not found')
    return token.symbol
}

export const giveBoltsForProtocol = async () => {
    const analyticsData = await fetchAnalyticsData(geb)

    const collateralPrices = Object.entries(analyticsData.tokenAnalyticsData).reduce((acc, [key, value]) => {
        acc[key] = parseFloat(formatUnits(value.currentPrice, 18))
        return acc
    }, {})
    const ethOracle = initOracle(ARBITRUM, MAINNET_CHAINLINK_ETH_USD_RELAYER)
    const { result } = await ethOracle.getResultWithValidity()
    const ethPrice = parseFloat(formatUnits(result, 18))
    // Fetch all users

    let allVaults = await getVaults(ARBITRUM)
    const allUsers = allVaults.reduce((acc, vault) => {
        if (!acc.includes(vault.owner)) acc.push(vault.owner)
        return acc
    }, [])

    let usersWithBolts = []
    for (const user of allUsers) {
        // Subgraph vault debt will always be stale, so fetch from chain
        if (user === "0x9492510bbcb93b6992d8b7bb67888558e12dcac4") {
            const [_userCoinBalance, safesData] = await fetchUserSafes(geb, user)
            let depositInUsd = 0
            let borrowInUsd = 0

            safesData.forEach(safe => {
                const collateralAmount = parseFloat(formatUnits(safe.lockedCollateral, 18))
                const collateralPrice = collateralPrices[getTypeFromBytes(safe.collateralType)]
                depositInUsd += collateralAmount * collateralPrice

                const debtAmount = parseFloat(formatUnits(safe.generatedDebt, 18))
                console.log(debtAmount)
                console.log(collateralAmount)
                const debtPrice = parseFloat(formatUnits(analyticsData.marketPrice, 18))
                borrowInUsd += debtAmount * debtPrice
            })
            const depositInEth = depositInUsd > 0 ? depositInUsd / ethPrice : 0
            const depositBolts = depositInEth * 500
            const borrowInEth = borrowInUsd > 0 ? borrowInUsd / ethPrice : 0
            const borrowBolts = borrowInEth * 1000

            usersWithBolts.push({
                address: user,
                depositInUsd,
                depositInEth,
                depositBolts,
                borrowInUsd,
                borrowInEth,
                borrowBolts,
            })
        }
    }
    console.log(usersWithBolts)

    const depositUsers = usersWithBolts.map(user => {
        if (user.depositBolts > 0) return {
            address: user.address,
            bolts: user.depositBolts
        }
    })
    await giveBolts(depositUsers, DEPOSIT_CAMPAIGN_EVENT)
    const borrowUsers = usersWithBolts.map(user => {
        if (user.borrowBolts > 0) return {
            address: user.address,
            bolts: user.borrowBolts
        }
    })
    await giveBolts(borrowUsers, BORROW_CAMPAIGN_EVENT)


    return
    const organizedVaults = vaults.reduce((acc, vault) => {
        if (!acc[vault.owner]) {
            acc[vault.owner] = {
                depositInUsd: 0,
                depositInEth: 0,
                depositBolts: 0,

                borrowInUsd: 0,
                borrowInEth: 0,
                borrowBolts: 0,
            };
        }

        // Deposit
        const collateralAmount = parseFloat(formatUnits(vault.collateral, 18))
        const collateralPrice = collateralPrices[vault.collateralType]
        const depositInUsd = collateralAmount * collateralPrice
        const depositInEth = depositInUsd / ethPrice
        acc[vault.owner].depositInUsd += depositInUsd;
        acc[vault.owner].depositInEth += depositInEth;
        acc[vault.owner].depositBolts += depositInEth * 500; // Deposit: 500 per ETH

        // Borrow
        const debtAmount = parseFloat(formatUnits(vault.debt, 18))
        const debtPrice = parseFloat(formatUnits(analyticsData.marketPrice, 18))
        const borrowInUsd = debtAmount * debtPrice
        const borrowInEth = borrowInUsd / ethPrice
        acc[vault.owner].borrowInUsd += borrowInUsd;
        acc[vault.owner].borrowInEth += borrowInEth;
        acc[vault.owner].borrowBolts += borrowInEth * 1000;

        return acc;
    }, {});
    console.log(organizedVaults["0x247b7e245002e6b525782366dec32446f645320d"])

    // Update user points
}
