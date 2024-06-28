import { Contract } from "@ethersproject/contracts";

import prisma from "../prisma";
import { Web3Providers } from "../web3/provider";
import { getUserVaults } from "../vaults";

import { getUserFuulData, getLeaderboard, giveFuulPoints, fetchFuulPagination, EVENT_NAME_SOCIAL_POINTS } from "./fuul";

import { giveBoltsForProtocol } from "./protocol";
import { giveBoltsForCamelot } from "./camelot";
import { giveBoltsForSocial, getSocialPoints } from "./social";

const CAMPAIGN_TYPES = ['COLLATERAL_DEPOSIT', 'DEBT_BORRROW', 'GALXE', 'ZEALY', 'ODG_ETH_LP', 'OD_ETH_LP']

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

export const executePointsOperation = async (type) => {
    if (type === "PROTOCOL") {
        return giveBoltsForProtocol()
    } else if (type === "CAMELOT") {
        return giveBoltsForCamelot()
    } else if (type === "SOCIAL") {
        return giveBoltsForSocial()
    } else if (type === "MULTIPLIER") {
        return updateMultipliers()
    } else if (type === "TURTLE") {
        return giveBoltsForTurtle()
    } else {
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

const updateMultipliers = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            multiplier: true,
            multipliers: true,
            multiplierEvents: true
        }
    })


    for (const user of users) {
        const multiplier = user.multipliers.reduce((acc, m) => acc * m.multiplier, 1)
        // Check turtle,

        // Check
    }

    const prismaTransactions = users.map(user => {
        const multiplier = user.multipliers.reduce((acc, m) => acc * m.multiplier, 1)
        return prisma.user.update({
            where: { id: user.id },
            data: { multiplier }
        })
    })

    try {
        await prisma.$transaction(prismaTransactions)
    } catch (error) {
        console.log(error)
        throw new Error("updateMultipliers() Error updating database")
    }
}

export const giveBolts = async (users, eventName) => {
    console.log("\nGiving bolts for users: ", users.length)
    console.log("Event name: ", eventName)
    console.log("Total Bolts: ", users.reduce((acc, user) => acc + user?.bolts, 0))

    // Fetch all user
    const prismaUsers = await prisma.user.findMany({
        where: { id: { in: users.map(user => user.address) } },
        select: {
            id: true,
            bolts: true,
            campaigns: { where: { type: eventName } },
            multiplier: true,
            multipliers: true
        }
    })

    // Product of points, multiplier
    const prismaTransactions = users.map(user => {
        const prismaUser = prismaUsers.find(pu => pu.id === user.address)
        if (!prismaUser) {
            return prisma.user.create({
                data: {
                    id: user.address,
                    bolts: user.bolts,
                    campaigns: {
                        create: {
                            type: eventName,
                            amount: user.bolts,
                            type: eventName
                        }
                    },
                    campaignEvents: {
                        create: {
                            type: eventName,
                            baseAmount: user.bolts,
                            multiplier: 1,
                            totalAmount: user.bolts
                        }
                    }
                }
            })
        } else {
            const { multiplier, bolts: previousBolts, campaigns } = prismaUser
            const newBoltsWithMultiplier = user.bolts * multiplier

            const campaign = campaigns[0]
            return prisma.user.update({
                where: { id: user.address },
                data: {
                    bolts: previousBolts + newBoltsWithMultiplier,
                    campaigns: {
                        ...(campaign ? {
                            update: {
                                where: { id: campaign.id },
                                data: { amount: campaign.amount + newBoltsWithMultiplier, }
                            }
                        } :
                            {
                                create: {
                                    amount: newBoltsWithMultiplier,
                                    type: eventName
                                }
                            }
                        )
                    },
                    campaignEvents: {
                        create: {
                            baseAmount: user.bolts,
                            multiplier,
                            totalAmount: newBoltsWithMultiplier,
                            type: eventName,
                        }
                    }
                }
            })
        }
    })

    try {
        await prisma.$transaction(prismaTransactions)
    } catch (error) {
        console.log(error)
        throw new Error("giveBolts() Error updating database")
    }
}

