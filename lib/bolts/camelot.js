import { parseEther } from "@ethersproject/units";

import { fetchAllCamelotUsersByPool, fetchspNftLpBalance, fetchNitroBalance, nitroBalanceToUsd, spNftLpToUsd, getContract } from "../web3/camelot";
import CamelotNitroPool from '../web3/abis/CamelotNitroPool.json'
import { fromBigNumber } from "../web3/common";
import { getEthPrice } from "../web3/oracle"

import { giveBolts } from "./bolts"

const OD_ETH_LP_CAMPAIGN_TYPE = 'OD_ETH_LP'
const ODG_ETH_LP_CAMPAIGN_TYPE = 'ODG_ETH_LP'

const OD_ETH_LP_BOLTS_PER_ETH = 3000
const ODG_ETH_LP_BOLTS_PER_ETH = 2000

export const giveBoltsForCamelot = async () => {
    // OD-ETH Depositors 
    const OD_ETH_POOL = "0x824959a55907d5350e73e151ff48dabc5a37a657"
    const OD_ETH_SPNFT = "0x7647Da336cF43F894aC7A0bf87f04806b2E03bb8"
    const OD_ETH_NITRO_POOL = "0xdaE425D131069803Ce2D8E5cfA08356d3eDD125E"

    // ODG-ETH Depositors 
    const ODG_ETH_POOL = "0xf935263c9950eb2881ff58bd6a76c3d2564a78d5"
    const ODG_ETH_SPNFT = "0xFc3078802C3bB1FE4b6aD86C23eBe28835224201"

    const [odEthDepositors, odgEthDepositors] = await Promise.all([
        getCamelotUserDeposits(OD_ETH_POOL, OD_ETH_SPNFT, OD_ETH_NITRO_POOL, OD_ETH_LP_BOLTS_PER_ETH),
        getCamelotUserDeposits(ODG_ETH_POOL, ODG_ETH_SPNFT, null, ODG_ETH_LP_BOLTS_PER_ETH)
    ]);

    await giveBolts(odEthDepositors, OD_ETH_LP_CAMPAIGN_TYPE)
    await giveBolts(odgEthDepositors, ODG_ETH_LP_CAMPAIGN_TYPE)

    let totalBolts = odEthDepositors.reduce((acc, user) => acc + user.bolts, 0) + odgEthDepositors.reduce((acc, user) => acc + user.bolts, 0)
    return {
        totalBolts,
        odEthDepositors: odEthDepositors.length,
        odgEthDepositors: odgEthDepositors.length,
    }
}
const getCamelotUserDeposits = async (poolAddress, spNftAddress, nitroAddress, boltsPerEth) => {
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

    const ethPrice = await getEthPrice()

    const usersWithPoints = await Promise.all(allDepositors.map(async userAddress => {
        const [spNftLpBalance, nitroBalance] = await Promise.all([
            fetchspNftLpBalance(userAddress, spNftAddress),
            nitroAddress ? fetchNitroBalance(userAddress, nitroAddress) : Promise.resolve(0)
        ]);

        const spNftValue = spNftLpToUsd(spNftLpBalance, relevantNftPool)
        let nitroValue = nitroAddress ? nitroBalanceToUsd(nitroBalance, totalNitroDepositAmount, nitroData.tvlUSD) : 0

        const userDollarValue = spNftValue + nitroValue
        const userEthValue = Math.round(userDollarValue) / ethPrice
        const bolts = userEthValue * boltsPerEth

        return { bolts, address: userAddress }
    }));
    return usersWithPoints.filter(user => user.bolts > 0)
}