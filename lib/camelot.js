import { giveFuulPoints, EVENT_NAME_OD_ETH_LP, EVENT_NAME_ODG_ETH_LP } from './fuul';
import { fetchAllCamelotUsersByPool, fetchspNftLpBalance, fetchNitroBalance, nitroBalanceToUsd, spNftLpToUsd, getContract } from "./web3/camelot";
import CamelotNitroPool from './web3/abis/CamelotNitroPool.json'
import { fromBigNumber } from "./web3/common";
import { parseEther } from "@ethersproject/units";

export const updateCamelotPointsForAllUsers = async () => {
    try {
        // OD-ETH Depositors 
        const OD_ETH_POOL = "0x824959a55907d5350e73e151ff48dabc5a37a657"
        const OD_ETH_SPNFT = "0x7647Da336cF43F894aC7A0bf87f04806b2E03bb8"
        const OD_ETH_NITRO_POOL = "0xdaE425D131069803Ce2D8E5cfA08356d3eDD125E"

        // ODG-ETH Depositors 
        const ODG_ETH_POOL = "0xf935263c9950eb2881ff58bd6a76c3d2564a78d5"
        const ODG_ETH_SPNFT = "0xFc3078802C3bB1FE4b6aD86C23eBe28835224201"

        const [odEthDepositors, odgEthDepositors] = await Promise.all([
            getCamelotUserDeposits(OD_ETH_POOL, OD_ETH_SPNFT, OD_ETH_NITRO_POOL),
            getCamelotUserDeposits(ODG_ETH_POOL, ODG_ETH_SPNFT)
        ]);

        await Promise.all([
            giveFuulPoints(odEthDepositors, EVENT_NAME_OD_ETH_LP),
            giveFuulPoints(odgEthDepositors, EVENT_NAME_ODG_ETH_LP)
        ]);

        let totalPoints = odEthDepositors.reduce((acc, user) => acc + Number(user.points), 0)
        totalPoints += odgEthDepositors.reduce((acc, user) => acc + Number(user.points), 0)
        return {
            totalPoints,
            odEthDepositors: odEthDepositors.length,
            odgEthDepositors: odgEthDepositors.length,
        }
    } catch (e) {
        throw e
    }
}
const getCamelotUserDeposits = async (poolAddress, spNftAddress, nitroAddress) => {
    const allDepositors = await fetchAllCamelotUsersByPool(poolAddress)

    const poolResponse = await fetch('https://api.camelot.exchange/nft-pools/')
    const poolRes = await poolResponse.json()
    let nftPools = Object.values(poolRes.data.nftPools)
    let relevantNftPool = nftPools.find(pool => pool.address === spNftAddress)

    let camelotNitroPool
    let totalNitroDepositAmount
    let nitroData
    if (nitroAddress) {
        const response = await fetch('https://api.camelot.exchange/nitros/')
        const res = await response.json()
        nitroData = res.data.nitros[nitroAddress]

        camelotNitroPool = getContract(nitroAddress, CamelotNitroPool.abi)
        totalNitroDepositAmount = fromBigNumber(await camelotNitroPool.totalDepositAmount());
    }

    const usersWithPoints = await Promise.all(allDepositors.map(async userAddress => {
        const [spNftLpBalance, nitroBalance] = await Promise.all([
            fetchspNftLpBalance(userAddress, spNftAddress),
            nitroAddress ? fetchNitroBalance(userAddress, nitroAddress) : Promise.resolve(0)
        ]);

        const spNftValue = spNftLpToUsd(spNftLpBalance, relevantNftPool)
        let nitroValue = nitroAddress ? nitroBalanceToUsd(nitroBalance, totalNitroDepositAmount, nitroData.tvlUSD) : 0

        const userDollarValue = spNftValue + nitroValue
        const userEthValue = Math.round(userDollarValue) / 3746
        const ethInWei = parseEther(userEthValue.toFixed(18).toString()).toString()

        return { points: ethInWei, address: userAddress }
    }));
    return usersWithPoints
}