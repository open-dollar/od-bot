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

    // Get Bolts earned
    const url = new URL("https://api.fuul.xyz/api/v1/payouts/leaderboard")
    const fuulItems = await fetchFuulPagination(url)
    const fuulUsers = fuulItems.map(item => ({
        address: item.address.toLowerCase(),
        points: Number(item.total_amount),
    }))
    console.log(`Fuul Total users: ${fuulUsers.length}`)

    // Get the difference between combined social points and bolts earned
    let usersWithPendingPoints = []
    usersWithCombinedPoints.forEach(user => {
        const fuulUser = fuulUsers.find(fuulUser => fuulUser.address === user.address)
        let fuulPoints = 0
        if (fuulUser?.points) fuulPoints = fuulUser?.points
        const newPoints = user.points - fuulPoints
        if (newPoints > 0) usersWithPendingPoints.push({ address: user.address, points: newPoints })
    })
    usersWithPendingPoints.push({ address: "0x0000000000000000000000000000000000000000", points: 420 })

    await giveFuulPoints(usersWithPendingPoints, EVENT_NAME_SOCIAL_POINTS)

    return { zealyUsers: zealyData.uniqueCount, galxeUsers: galxeData.uniqueCount, fuulUsers: fuulUsers.length }
}