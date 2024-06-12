import { Web3Providers } from "./web3/provider";
import { getUserVaults } from "./userVaults";
import prisma from "./prisma";
import { Contract } from "@ethersproject/contracts";
import { getUserFuulData, getLeaderboard } from "./fuul";
import { fetchGalxeUsers } from "./galxe";
import { fetchZealyUsers } from "./zealy";
import { giveFuulPoints, fetchFuulPagination, EVENT_NAME_SOCIAL_POINTS } from './fuul.js';

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
        fuul: { user, leaderboard },
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

const getSocialPoints = async (address) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: address.toLowerCase() }
        })

        return {
            galxe: user?.galxePoints > 0,
            zealy: !user?.zealyPoints > 0
        }
    } catch (error) {
        console.error('Error fetching points by campaign:', error)
        return { galxe: null, zealy: null }
    }
}

export const giveBoltsForGaxleZealy = async () => {
    let allUsers = []
    const zealyData = await fetchZealyUsers()
    allUsers.push(...zealyData.users)
    console.log(`Zealy unique users: ${zealyData.uniqueCount}. Total users ${zealyData.totalCount}`)

    const galxeData = await fetchGalxeUsers()
    allUsers.push(...galxeData.users)
    console.log(`Galxe unique users: ${galxeData.uniqueCount}. Total users: ${galxeData.totalCount}`)

    // Combine points
    let usersWithCombinedPoints = []
    allUsers.forEach(newUser => {
        const existingUserIndex = usersWithCombinedPoints.findIndex(user => user.address === newUser.address);
        if (existingUserIndex !== -1) {
            usersWithCombinedPoints[existingUserIndex].points += newUser.points;
        } else {
            usersWithCombinedPoints.push({ address: newUser.address, points: newUser.points });
        }
    });

    // Get the difference between combined social points and bolts earned
    let usersWithPendingPoints = []
    for (const user of usersWithCombinedPoints) {
        const url = `https://api.fuul.xyz/api/v1/payouts?type=point&user_address=${user.address}`
        let conversions = await fetchFuulPagination(url)
        const socialConversion = conversions?.find(conversion => conversion.conversion_id === 6)

        let socialPoints = 0
        if (socialConversion?.total_amount) socialPoints = Number(socialConversion.total_amount)
        let newPoints = user.points - socialPoints

        if (newPoints > 0) usersWithPendingPoints.push({ address: user.address, points: newPoints })

        // console.log("User: ", user.address)
        // console.log("Points from Galxe, Zealy:  ", user.points)
        // console.log("Bolts earned for social: ", socialConversion?.total_amount)
        // console.log("Points owed: ", newPoints)
        // console.log("\n")
    }

    usersWithPendingPoints.push({ address: "0x0000000000000000000000000000000000000000", points: 420 })

    await giveFuulPoints(usersWithPendingPoints, EVENT_NAME_SOCIAL_POINTS)

    return { zealyUsers: zealyData.uniqueCount, galxeUsers: galxeData.uniqueCount, usersWithPendingPoints: usersWithPendingPoints.length }
}