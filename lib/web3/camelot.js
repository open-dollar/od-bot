import { formatUnits } from "@ethersproject/units";
import { Web3Providers } from "./provider";
import { Contract } from "@ethersproject/contracts";
import { postQuery } from "../utils"
import { fromBigNumber } from "./common"

const CamelotNitroPool = require('./abis/CamelotNitroPool.json');
const CamelotPool = require('./abis/CamelotPool.json');
const AlgebraPositions = require('./abis/AlgebraPositions.json');
const SpNFT = require('./abis/SpNFT.json');

export const getContract = (address, abi) => new Contract(address, abi, Web3Providers["ARBITRUM"])

const valueFromAlgebraPositions = async (userAddress, collateral0Address, collateral1Address) => {
    const CAMELOT_V1_NFT_ADDRESS = "0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15"
    const algebraPositionsContract = getContract(CAMELOT_V1_NFT_ADDRESS, AlgebraPositions.abi)
    const nftCount = await algebraPositionsContract.balanceOf(userAddress);
    let lpBalance = 0;
    for (let i = 0; i < nftCount; i++) {
        const tokenId = await algebraPositionsContract.tokenOfOwnerByIndex(userAddress, i);
        const positions = await algebraPositionsContract.positions(tokenId);
        if (positions.token0.toLowerCase() === collateral0Address.toLowerCase() && positions.token1.toLowerCase() === collateral1Address.toLowerCase()) {
            lpBalance += fromBigNumber(positions.liquidity);
        }
    }

    // Convert LP Balance to dollar value

    // Calculate the user's share
    const userDollarValue = 0

    console.log('Value from Algebra Positions V1:', userDollarValue);
    return userDollarValue;
}

export const fetchspNftLpBalance = async (userAddress, spNftAddress) => {
    const spNftContract = getContract(spNftAddress, SpNFT.abi);

    // Get LP Balance for all spNFTs owned by user
    const spNftCount = await spNftContract.balanceOf(userAddress);
    let lpBalance = 0
    for (let i = 0; i < spNftCount; i++) {
        const tokenId = await spNftContract.tokenOfOwnerByIndex(userAddress, i);

        const positionDetails = await spNftContract.getStakingPosition(tokenId);
        lpBalance += fromBigNumber(positionDetails.amount);
    }

    return lpBalance
}

export const spNftLpToUsd = (lpBalance, nftPoolData) => {
    const userShare = lpBalance / fromBigNumber(nftPoolData.totalDeposit);
    const userDollarValue = userShare * nftPoolData.tvlUSD

    return userDollarValue
}

export const fetchNitroBalance = async (userAddress, nitroPoolAddress) => {
    const camelotNitroPool = getContract(nitroPoolAddress, CamelotNitroPool.abi)

    const userInfo = await camelotNitroPool.userInfo(userAddress);
    const userDepositAmount = fromBigNumber(userInfo.totalDepositAmount);

    return userDepositAmount
}

export const nitroBalanceToUsd = (nitroBalance, totalDepositAmount, tvlUSD) => {
    const userPoolPercentage = nitroBalance / totalDepositAmount;
    const userDollarValue = userPoolPercentage * tvlUSD;

    return userDollarValue
}

export const valueInCamelot = async (userAddress, camelotPoolAddress, nitroPoolAddress) => {
    let userDollarValue = 0;

    //////////////////////////
    // spNFT 
    //////////////////////////
    const response = await fetch('https://api.camelot.exchange/nitros/')
    const res = await response.json()
    const nitroData = res.data.nitros[nitroPoolAddress]

    const spNftAddress = nitroData.nftPool
    const spNftLpBalance = await fetchspNftLpBalance(userAddress, spNftAddress);

    // Convert LP to USD
    const poolResponse = await fetch('https://api.camelot.exchange/nft-pools/')
    const poolRes = await poolResponse.json()

    let nftPools = Object.values(poolRes.data.nftPools)
    let relevantNftPool = nftPools.find(pool => pool.address === spNftAddress)
    userDollarValue += spNftLpToUsd(spNftLpBalance, relevantNftPool)

    //////////////////////////
    // Nitro Pool
    //////////////////////////
    const nitroBalance = await fetchNitroBalance(userAddress, nitroPoolAddress);

    const camelotNitroPool = getContract(nitroPoolAddress, CamelotNitroPool.abi)
    const totalDepositAmount = fromBigNumber(await camelotNitroPool.totalDepositAmount());

    userDollarValue += nitroBalanceToUsd(nitroBalance, totalDepositAmount, nitroData.tvlUSD)

    //////////////////////////
    // Algebra Positions V1
    //////////////////////////
    // NOTE: Avoid using Algebra Positions V1, since liquidity can be added outside of the current range

    return userDollarValue
}

export const fetchAllCamelotUsersByPool = async (poolAddress) => {
    const url = "https://api.thegraph.com/subgraphs/name/camelotlabs/camelot-amm-v3-2"
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    const variables = { pool: poolAddress }
    const query = `query MyQuery($pool: String!) {
        mints(first: 1000, where: {pool: $pool}) {
          origin
        }
      }`
    const response = await postQuery(url, query, variables, headers)
    let allUsers = []
    response.data.mints.map(mint => {
        if (!allUsers.includes(mint.origin)) allUsers.push(mint.origin)
    })
    return allUsers
}
