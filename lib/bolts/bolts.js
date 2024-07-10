import prisma from "../prisma.js";

import { giveBoltsForProtocol } from "./protocol";
import { giveBoltsForCamelot } from "./camelot";
import { giveBoltsForSocial } from "./social";
import { checkMultipliers, MULTIPLIER_BASE, ADDED_MULTIPLIER_EVENT_ACTIVITY, REMOVED_MULTIPLIER_EVENT_ACTIVITY } from "./multiplier"

// Available campaign groups to process bolts eg. "/api/points?type=CAMELOT" 
export const POINTS_OPERATION = [
    // CAMPAIGNS GROUPS
    'PROTOCOL', // Triggers: COLLATERAL_DEPOSIT, DEBT_BORRROW
    'CAMELOT', // Triggers: OD_ETH_LP, ODG_ETH_LP
    'SOCIAL', //  Triggers:  GALXE, ZEALY

    // OTHER 
    'MULTIPLIER', // Triggers an update to all multipliers
]

export const executePointsOperation = async (type) => {
    if (type === "PROTOCOL") {
        return giveBoltsForProtocol()
    } else if (type === "CAMELOT") {
        return giveBoltsForCamelot()
    } else if (type === "SOCIAL") {
        return giveBoltsForSocial()
    } else if (type === "MULTIPLIER") {
        return checkMultipliers()
    } else {
        throw new Error(`Invalid campaign type: ${type}`)
    }
}

const getLeaderboard = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            bolts: true,
            campaigns: true,
            multiplier: true,
            multipliers: true
        },
        orderBy: { bolts: "desc" },
        take: 100
    })

    return users.map((user, index) => ({
        rank: index + 1,
        address: user.id,
        ...user
    }));
}

export const getUserBolts = async (address) => {
    const leaderboard = await getLeaderboard()
    const response = { leaderboard }

    if (address) {
        const user = await prisma.user.findUnique({
            where: { id: address.toLowerCase() },
            select: {
                bolts: true,
                multiplier: true,
                multipliers: true,
                campaigns: true,
            }
        })
        const users = await prisma.user.findMany({
            orderBy: {
                bolts: 'desc'
            },
            select: {
                id: true
            }
        });
        const userIndex = users.findIndex(u => u.id === address.toLowerCase());
        const multiplier = user ? user.multiplier / 100 : MULTIPLIER_BASE
        response.user = { ...user, rank: userIndex + 1, address, multiplier }
    }

    return response
}


export const updateMultipliers = async (users) => {
    console.log("\nUpdating multipliers for users: ", users.length)

    // Fetch all user
    const prismaUsers = await prisma.user.findMany({
        where: { id: { in: users.map(user => user.address) } },
        select: {
            id: true,
            multiplier: true,
            multipliers: true
        }
    })

    // Product of points, multiplier
    const prismaTransactions = users.map(user => {
        const prismaUser = prismaUsers.find(u => u.id === user.address)
        if (!prismaUser && user.activity === ADDED_MULTIPLIER_EVENT_ACTIVITY) {
            return prisma.user.create({
                data: {
                    id: user.address,
                    multiplier: MULTIPLIER_BASE + user.multiplier,
                    multipliers: {
                        create: {
                            amount: user.multiplier,
                            type: user.multiplierEventType,
                        }
                    }
                }
            })
        } else if (prismaUser) {
            if (user.activity === ADDED_MULTIPLIER_EVENT_ACTIVITY) {
                const existingMultiplier = prismaUser.multipliers.find(m => m.type === user.multiplierEventType)
                if (existingMultiplier) return // Already added

                const newMultiplier = prismaUser.multipliers.reduce((acc, m) => m.amount + acc, MULTIPLIER_BASE) + user.multiplier
                return prisma.user.update({
                    where: { id: user.address },
                    data: {
                        multiplier: newMultiplier,
                        multipliers: {
                            create: {
                                amount: user.multiplier,
                                type: user.multiplierEventType
                            }
                        }
                    }
                })
            } else if (user.activity === REMOVED_MULTIPLIER_EVENT_ACTIVITY) {
                const multiplierToRemove = prismaUser.multipliers.find(m => m.type === user.multiplierEventType)
                if (!multiplierToRemove) return // Already removed

                const newMultiplier = prismaUser.multipliers.reduce((acc, m) => m.amount + acc, MULTIPLIER_BASE) - multiplierToRemove.amount

                return prisma.user.update({
                    where: { id: user.address },
                    data: {
                        multiplier: newMultiplier,
                        multipliers: {
                            delete: {
                                id: multiplierToRemove.id
                            }
                        }
                    }
                })
            }
        } else {
            // No prisma user and multiplier event activity is "REMOVED". No action needed.  
        }
    })
    const prismaTransactionsFiltered = prismaTransactions.filter(t => t)
    try {
        await prisma.$transaction(prismaTransactionsFiltered)
        return { users: prismaTransactionsFiltered.length }
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
        }
    })

    // Product of points, multiplier
    const prismaTransactions = users.map(user => {
        const prismaUser = prismaUsers.find(pu => pu.id === user.address)
        if (!prismaUser) {
            if (user.address.length !== 42) {
                console.log(user)
                return // Invalid address
            }
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
                            multiplier: MULTIPLIER_BASE,
                            totalAmount: user.bolts
                        }
                    }
                }
            })
        } else {
            const { multiplier, bolts: previousBolts, campaigns } = prismaUser
            const newBoltsWithMultiplier = user.bolts * multiplier / 100

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

