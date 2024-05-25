import { formatUnits } from "@ethersproject/units";
import { Web3Providers } from "./provider";
import { Contract } from "@ethersproject/contracts";
import { postQuery } from "../utils"

const CamelotNitroPool = require('./abis/CamelotNitroPool.json');
const CamelotPool = require('./abis/CamelotPool.json');
const AlgebraPositions = require('./abis/AlgebraPositions.json');
const SpNFT = require('./abis/SpNFT.json');
const LpToken = require('./abis/LpToken.json');

const getContract = (address, abi) => new Contract(address, abi, Web3Providers["ARBITRUM"])

const fromBigNumber = (number, decimals = 18) => {
    return parseFloat(formatUnits(number.toString(), decimals))
}

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

const valueFromSpNFTs = async (userAddress, nitroPoolAddress, collateral0Address, collateral1Address) => {
    let response = await fetch('https://api.camelot.exchange/nitros/')
    let res = await response.json()
    const nitroData = res.data.nitros[nitroPoolAddress]

    const spNFTAddress = nitroData.nftPool
    const spNFTContract = getContract(spNFTAddress, SpNFT.abi);

    // Validate LP collateral tokens match expected values
    const poolInfo = await spNFTContract.getPoolInfo();
    const lpToken = getContract(poolInfo.lpToken, LpToken.abi);
    const lpCollateral0Address = await lpToken.token0();
    const lpCollateral1Address = await lpToken.token1();
    if (lpCollateral0Address.toLowerCase() !== collateral0Address.toLowerCase() || lpCollateral1Address.toLowerCase() !== collateral1Address.toLowerCase()) {
        throw 'fetchSpNFTBalances - Invalid LP Token'
    }

    // Get LP Balance for all spNFTs owned by user
    const spNFTCount = await spNFTContract.balanceOf(userAddress);
    let lpBalance = 0
    for (let i = 0; i < spNFTCount; i++) {
        const tokenId = await spNFTContract.tokenOfOwnerByIndex(userAddress, i);

        const positionDetails = await spNFTContract.getStakingPosition(tokenId);
        lpBalance += fromBigNumber(positionDetails.amount);
    }

    // Convert LP Balance to dollar value
    response = await fetch('https://api.camelot.exchange/nft-pools/')
    res = await response.json()

    let nftPools = Object.values(res.data.nftPools)
    let relevantNftPool = nftPools.find(pool => pool.address === spNFTAddress)

    // Calculate the user's share
    const userShare = lpBalance / fromBigNumber(relevantNftPool.totalDeposit);
    const userDollarValue = userShare * relevantNftPool.tvlUSD

    return userDollarValue
}

const valueFromNitroPool = async (userAddress, nitroPoolAddress) => {
    const camelotNitroPool = getContract(nitroPoolAddress, CamelotNitroPool.abi)

    const userInfo = await camelotNitroPool.userInfo(userAddress);

    const totalDepositAmount = fromBigNumber(await camelotNitroPool.totalDepositAmount());
    const userDepositAmount = fromBigNumber(userInfo.totalDepositAmount);

    // Convert LP Balance to dollar value
    const response = await fetch('https://api.camelot.exchange/nitros/')
    const res = await response.json()
    const nitroData = res.data.nitros[nitroPoolAddress]

    const userPoolPercentage = userDepositAmount / totalDepositAmount;
    const userDollarValue = userPoolPercentage * nitroData.tvlUSD;

    return userDollarValue
}

export const valueInCamelot = async (userAddress, camelotPoolAddress, nitroPoolAddress) => {
    const camelotPool = getContract(camelotPoolAddress, CamelotPool.abi)

    // Only used to validate LP collateral tokens match expected values 
    const collateral0Address = await camelotPool.token0()
    const collateral1Address = await camelotPool.token1()

    let userDollarValue = 0;

    // Avoid using Algebra Positions V1, since liquidity can be added outside of the current range
    // userDollarValue += await valueFromAlgebraPositions(userAddress, collateral0Address, collateral1Address);

    userDollarValue += await valueFromSpNFTs(userAddress, nitroPoolAddress, collateral0Address, collateral1Address);

    userDollarValue += await valueFromNitroPool(userAddress, nitroPoolAddress);

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
