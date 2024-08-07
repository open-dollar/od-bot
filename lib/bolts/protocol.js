import { getVaults } from "../vaults"
import { fetchAnalyticsData } from "@opendollar/sdk/lib/virtual/virtualAnalyticsData"

import { fetchUserSafes } from '@opendollar/sdk/lib/virtual/virtualUserSafes.js'

import { initGeb } from "../web3/geb.js"
import { formatUnits } from "@ethersproject/units"
import { giveBolts } from "./bolts.js"

import { getEthPrice } from "../web3/oracle.js"

const ARBITRUM = "ARBITRUM"

const DEPOSIT_CAMPAIGN_EVENT = 'COLLATERAL_DEPOSIT'
const BORROW_CAMPAIGN_EVENT = 'DEBT_BORROW'

const DEPOSIT_BOLTS_PER_ETH = 500
const BORROW_BOLTS_PER_ETH = 1000

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


    const ethPrice = await getEthPrice()
    // Fetch all users

    let allVaults = await getVaults(ARBITRUM)
    const allUsers = allVaults.reduce((acc, vault) => {
        if (!acc.includes(vault.owner)) acc.push(vault.owner)
        return acc
    }, [])

    let usersWithBolts = []
    await Promise.all(allUsers.map(async (user) => {
        // Subgraph vault debt will always be stale, so fetch from chain
        const [_userCoinBalance, safesData] = await fetchUserSafes(geb, user)
        let depositInUsd = 0
        let borrowInUsd = 0

        safesData.forEach(safe => {
            const collateralAmount = parseFloat(formatUnits(safe.lockedCollateral, 18))
            const collateralPrice = collateralPrices[getTypeFromBytes(safe.collateralType)]
            depositInUsd += collateralAmount * collateralPrice

            const debtAmount = parseFloat(formatUnits(safe.generatedDebt, 18))
            const debtPrice = parseFloat(formatUnits(analyticsData.marketPrice, 18))
            borrowInUsd += debtAmount * debtPrice
        })
        const depositInEth = depositInUsd > 0 ? depositInUsd / ethPrice : 0
        const depositBolts = depositInEth * DEPOSIT_BOLTS_PER_ETH
        const borrowInEth = borrowInUsd > 0 ? borrowInUsd / ethPrice : 0
        const borrowBolts = borrowInEth * BORROW_BOLTS_PER_ETH

        usersWithBolts.push({
            address: user,
            depositInUsd,
            depositInEth,
            depositBolts,
            borrowInUsd,
            borrowInEth,
            borrowBolts,
        })
    }))

    const depositUsers = usersWithBolts.filter(user => user.depositBolts > 0).map(user => ({
        address: user.address,
        bolts: user.depositBolts
    }))
    await giveBolts(depositUsers, DEPOSIT_CAMPAIGN_EVENT)
    const borrowUsers = usersWithBolts.filter(user => user.borrowBolts > 0).map(user => ({
        address: user.address,
        bolts: user.borrowBolts
    })
    )
    await giveBolts(borrowUsers, BORROW_CAMPAIGN_EVENT)
    const totalBolts = depositUsers.reduce((acc, user) => acc + user.bolts, 0) + borrowUsers.reduce((acc, user) => acc + user.bolts, 0)

    return {
        depositUsers: depositUsers.length,
        borrowUsers: borrowUsers.length,
        totalBolts
    }
}
