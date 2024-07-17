import prisma from "../prisma";

import { giveBolts } from "./bolts"
import { fetchGalxeUsers } from "./galxe";
import { fetchZealyUsers } from "./zealy";

const GALXE_CAMPAIGN_EVENT = "GALXE"
const ZEALY_CAMPAIGN_EVENT = "ZEALY"

const fetchUsers = async (users, campaignType) => {
    const prismaUsers = await prisma.user.findMany({
        where: { id: { in: users.map(user => user.address) } },
        select: {
            campaigns: { where: { type: campaignType } },
            id: true
        }
    })
    return prismaUsers
}

const giveNewBoltsByCampaign = async (users, campaignType) => {
    const prismaUsers = await fetchUsers(users, campaignType)

    let usersWithNewBolts = []
    for (const user of users) {

        // Compare social points with the relevant campaign bolts
        let pointsOwed = user.points
        const prismaUser = prismaUsers.find(existingUser => existingUser.id === user.address)
        if (prismaUser && prismaUser.campaigns[0]) {
            pointsOwed -= prismaUser.campaigns[0].amount
        }
        if (pointsOwed > 0) {
            usersWithNewBolts.push({ address: user.address, bolts: pointsOwed })
        }
    }

    await giveBolts(usersWithNewBolts, campaignType)
    return usersWithNewBolts.reduce((acc, user) => acc + user.bolts, 0)
}

const giveBoltsForGalxe = async () => {
    const galxeData = await fetchGalxeUsers()
    console.log(`\nGalxe unique users: ${galxeData.uniqueCount}. Total users: ${galxeData.totalCount}`)
    const totalBolts = await giveNewBoltsByCampaign(galxeData.users, GALXE_CAMPAIGN_EVENT)
    return {
        totalBolts,
        users: galxeData.totalCount
    }
}

const giveBoltsForZealy = async () => {
    const zealyData = await fetchZealyUsers()
    console.log(`\nZealy unique users: ${zealyData.uniqueCount}. Total users ${zealyData.totalCount}`)
    const totalBolts = await giveNewBoltsByCampaign(zealyData.users, ZEALY_CAMPAIGN_EVENT)
    return {
        totalBolts,
        users: zealyData.totalCount
    }
}

export const giveBoltsForSocial = async () => {
    const galxe = await giveBoltsForGalxe()
    const zealy = await giveBoltsForZealy()
    return {
        zealy,
        galxe
    }
}