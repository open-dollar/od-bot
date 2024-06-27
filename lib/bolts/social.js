import prisma from "../prisma";

import { giveBolts } from "./bolts"
import { fetchGalxeUsers } from "./galxe";
import { fetchZealyUsers } from "./zealy";

const GALXE_CAMPAIGN_EVENT = "GALXE"
const ZEALY_CAMPAIGN_EVENT = "ZEALY"

export const getSocialPoints = async (address) => {
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

const fetchUsers = async (users, campaignType) => {
    const prismaUsers = await prisma.user.findMany({
        where: { id: { in: users.map(user => user.address) } },
        select: {
            campaigns: { where: { campaignType } }
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
        const prismaUser = prismaUsers.find(user => user.id === user.address)
        if (prismaUser)
            pointsOwed -= prismaUser.campaigns[0].points
        if (pointsOwed > 0)
            usersWithNewBoltsd.push({ address: user.address, points: pointsOwed })
    }

    giveBolts(usersWithNewBolts, GALXE_CAMPAIGN_EVENT)
}

const giveBoltsForGalxe = async () => {
    const galxeData = await fetchGalxeUsers()
    console.log(`Galxe unique users: ${galxeData.uniqueCount}. Total users: ${galxeData.totalCount}`)
    await giveNewBoltsByCampaign(galxeData.users, GALXE_CAMPAIGN_EVENT)
}

const giveBoltsForZealy = async () => {
    const zealyData = await fetchZealyUsers()
    console.log(`Zealy unique users: ${zealyData.uniqueCount}. Total users ${zealyData.totalCount}`)
    await giveNewBoltsByCampaign(zealyData.users, ZEALY_CAMPAIGN_EVENT)
}

export const giveBoltsForSocial = async () => {
    await giveBoltsForGalxe()
    await giveBoltsForZealy()
}