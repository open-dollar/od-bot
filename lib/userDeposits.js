import { getUserVaults } from "./userVaults"
import { initGeb } from "./web3/geb"
import { fetchAnalyticsData } from "@opendollar/sdk/lib/virtual/virtualAnalyticsData"
import { formatUnits } from "@ethersproject/units"

export const getUserDeposits = async (address, network) => {
    let geb
    try {
        geb = initGeb(network)
        if (!geb) {
            throw new Error('Failed to initialize GEB')
        }
    } catch (e) {
        throw new Error('Failed to initialize GEB')
    }

    const userVaults = await getUserVaults(address, network)
    const vaults = userVaults.vaults

    const analyticsData = await fetchAnalyticsData(geb)

    const collateralPrices = Object.entries(analyticsData.tokenAnalyticsData).reduce((acc, [key, value]) => {
        acc[key] = parseFloat(formatUnits(value.currentPrice, 18))
        return acc
    }, {})

    let totalCollateralInUSD = 0

    vaults.forEach(vault => {
        const collateralType = vault.collateralType
        const collateralAmount = parseFloat(formatUnits(vault.collateral, 18))
        const collateralPrice = collateralPrices[collateralType]

        if (collateralAmount && collateralPrice) {
            totalCollateralInUSD += collateralAmount * collateralPrice
        }
    })

    return { totalCollateralInUSD: totalCollateralInUSD.toFixed(2) }
}