import prisma from "./prisma";
import { postQuery } from './utils';
import { giveFuulPoints, EVENT_NAME_OD_ETH_LP, EVENT_NAME_ODG_ETH_LP } from './fuul';
import { fetchAllCamelotUsersByPool } from "./web3/camelot";

export const updateCamelotPointsForAllUsers = async (campaignId) => {
    try {
        // OD-ETH Depositors 
        const OD_ETH_POOL = "0x824959a55907d5350e73e151ff48dabc5a37a657"
        const odEthDepositors = await camelotUserDepositsByPool(OD_ETH_POOL)
        return

        // TODO: uncomment to start sending points
        // await giveFuulPoints(odEthDepositors, EVENT_NAME_OD_ETH_LP)

        // ODG-ETH Depositors 
        const ODG_ETH_POOL = "0xf935263c9950eb2881ff58bd6a76c3d2564a78d5"
        const odgEthDepositors = await camelotUserDepositsByPool(ODG_ETH_POOL)
        // TODO: uncomment to start sending points
        // await giveFuulPoints(odgEthDepositors, EVENT_NAME_ODG_ETH_LP)

        console.log(`Camelot odEthDepositors: ${odEthDepositors.length} odgEthDepositors: ${odgEthDepositors.length}`)

        let totalPoints = odEthDepositors.reduce((acc, user) => acc + user.points, 0)
        totalPoints += odgEthDepositors.reduce((acc, user) => acc + user.points, 0)

        return {
            totalPoints,
            odEthDepositors: odEthDepositors.length,
            odgEthDepositors: odgEthDepositors.length,
        }
    } catch (e) {
        console.log(e)
        // TODO: end error message in Discord
        return { error: e.message }
    }
}

const camelotUserDepositsByPool = async (poolAddress) => {
    const allDepositors = await fetchAllCamelotUsersByPool(poolAddress)
    // Get current ETH value deposited in pool
    console.log(allDepositors)
    console.log(allDepositors.length)

    // TODO: convert deposts to pooints
    // const user = { points: 1, address }
    return allDepositors
}