import { Web3Providers } from "./provider";
import { Contract } from "@ethersproject/contracts";
import { postQuery } from "../utils"
import { fromBigNumber } from "./common"

const CamelotNitroPool = require('./abis/CamelotNitroPool.json');
const SpNFT = require('./abis/SpNFT.json');

export const getContract = (address, abi) => new Contract(address, abi, Web3Providers["ARBITRUM"])

export const fetchspNftLpBalance = async (userAddress, spNftAddress) => {
    const spNftContract = getContract(spNftAddress, SpNFT.abi);

    // Get LP Balance for all spNFTs owned by user
    const spNftCount = await spNftContract.balanceOf(userAddress);
    let lpBalance = 0

    const promises = [];
    for (let i = 0; i < spNftCount; i++) {
        promises.push(spNftContract.tokenOfOwnerByIndex(userAddress, i));
    }

    const tokenIds = await Promise.all(promises);

    const positionPromises = tokenIds.map(tokenId => spNftContract.getStakingPosition(tokenId));

    const positions = await Promise.all(positionPromises);

    for (const position of positions) {
        lpBalance += fromBigNumber(position.amount);
    }

    return lpBalance
}

export const spNftLpToUsd = (lpBalance, nftPoolData) => {
    const userShare = lpBalance / fromBigNumber(nftPoolData.totalDeposit);
    return userShare * nftPoolData.tvlUSD
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

export const valueInCamelot = async (userAddress, nitroPoolAddress) => {
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
    const url = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.SUBGRAPH_API_KEY}/subgraphs/id/3utanEBA9nqMjPnuQP1vMCCys6enSM3EawBpKTVwnUw2`
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

    const allUsers = []
    for (const mint of response.data.mints) {
        if (!allUsers.includes(mint.origin)) allUsers.push(mint.origin)
    }
    return allUsers
}
