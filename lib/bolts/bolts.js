import { Contract } from "@ethersproject/contracts";

import prisma from "../prisma";
import { Web3Providers } from "../web3/provider";
import { getUserVaults } from "../vaults";

import { getUserFuulData, getLeaderboard, giveFuulPoints, fetchFuulPagination, EVENT_NAME_SOCIAL_POINTS } from "./fuul";

import { giveBoltsForProtocol } from "./protocol";
import { giveBoltsForCamelot } from "./camelot";
import { giveBoltsForSocial, getSocialPoints } from "./social";

// Available campaign groups to process bolts eg. "/api/points?type=CAMELOT" 
export const POINTS_OPERATION = [
    // CAMPAIGNS GROUPS
    'PROTOCOL', // Triggers: COLLATERAL_DEPOSIT, DEBT_BORRROW
    'CAMELOT', // Triggers: OD_ETH_LP, ODG_ETH_LP
    'SOCIAL', //  Triggers:  GALXE, ZEALY

    // OTHER 
    'MULTIPLIER', // Triggers an update to all multipliers
    'TURTLE',
]
const CAMPAIGN_TYPES = ['COLLATERAL_DEPOSIT', 'DEBT_BORRROW', 'GALXE', 'ZEALY', 'ODG_ETH_LP', 'OD_ETH_LP']

export const updateBoltsByCampaign = async (type) => {
    switch (type) {
        case "CAMELOT":
            return await giveBoltsForCamelot()
        case "SOCIAL":
            return await giveBoltsForSocial()
        case "TURTLE":
            return await giveBoltsForTurtle()
        case "PROTOCOL":
            return await giveBoltsForProtocol()
        default:
            throw new Error(`Invalid campaign type: ${type}`)
    }
}

export const getUserBolts = async (address) => {
    let OgNFV = false;
    let GenesisNFT = false;
    let OgNFT = false;
    let galxe = false;
    let zealy = false;
    let user = null;
    let campaignPoints = []

    if (address) {
        OgNFV = await hasOgNFV(address);
        GenesisNFT = await hasGenesisNFT(address);
        OgNFT = await hasOgNFT(address);

        ({ galxe, zealy } = await getSocialPoints(address))
        user = await getUserFuulData(address);
    }

    const leaderboard = await getLeaderboard()

    return {
        OgNFT,
        OgNFV,
        GenesisNFT,
        galxe,
        zealy,
        fuul: {
            user,
            leaderboard
        },
    }
}

const hasOgNFV = async (address) => {
    try {
        const data = await getUserVaults(address, "ARBITRUM");
        let hasOgNFV = false;
        data.vaults.map(vault => {
            if (vault.genesis) hasOgNFV = true;
        })
        return hasOgNFV
    } catch (error) {
        console.log(error)
        return null
    }
}

const fetchTokenBalance = async (network, tokenAddress, userAddress) => {
    const provider = Web3Providers[network];

    const ERC721_ABI = [
        'function balanceOf(address owner) view returns (uint256)',
    ];
    const tokenContract = new Contract(tokenAddress, ERC721_ABI, provider);
    return await tokenContract.balanceOf(userAddress);
};

const hasGenesisNFT = async (address) => {
    try {
        const tokenAddress = "0x3D6d1f3cEeb33F8cF3906bb716360ba25037beC8"
        const balance = await fetchTokenBalance("ARBITRUM", tokenAddress, address);

        if (balance > 0) return true;
        return false
    } catch (error) {
        console.log(error)
        return null
    }
}

const hasOgNFT = async (address) => {
    try {
        const tokenAddress = "0x346324e797c8Fa534B10fC9127CCFD9cB9E9AAB7"
        const balance = await fetchTokenBalance("POLYGON", tokenAddress, address);

        if (balance > 0) return true;
        return false
    } catch (error) {
        console.log(error)
        return null
    }
}

export const giveBolts = async (users, eventName) => {
    console.log("\nGiving bolts for users: ", users.length)
    console.log("Event name: ", eventName)
    console.log("Total Bolts: ", users.reduce((acc, user) => acc + user.bolts, 0))
    return
    // Fetch all user
    const userList = await prisma.user.findMany({
        where: { id: { in: users.map(user => user.address) } }
    })
    console.log(ususerListers)
    // Product of points, multiplier

    // Update database
}

