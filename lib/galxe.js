import { postQuery } from './utils';
import prisma from "./prisma";

// ✅ Get points from galxe
// Update database and get difference in points
// Send points to fuul 

export const updateGalxePointsForAllUsers = async () => {
    const campaignId = "GCHpqttjuU"
    const { users, count } = await fetchGalxeUsersByCampaign(campaignId)
    const usersWithNewPoints = await updateUsersAndGetNewPoints(users)
    console.log(`Updated ${usersWithNewPoints.length} users from ${count}`)
    // Batch update fuul points
}

const updateUsersAndGetNewPoints = async (users) => {
    let usersWithNewPoints = []
    await users.filter(user => user.address).map(async galxeUser => {
        let newPoints = 0

        let user = await prisma.galxeUser.findUnique({
            where: { id: galxeUser.address }
        })

        if (!user) {
            await prisma.galxeUser.create({
                data: { id: galxeUser.address, points: galxeUser.points }
            })
            newPoints = galxeUser.points
        } else if (user.points !== galxeUser.points) {
            await prisma.galxeUser.update({
                where: { id: galxeUser.address, },
                data: { points: galxeUser.points }
            })
            newPoints = galxeUser.points - user.points
        }

        if (newPoints > 0) {
            console.log("NEW points")
            usersWithNewPoints.push({ address: galxeUser.address, points: newPoints })
        }
    })
    return usersWithNewPoints
}

const fetchGalxeUsersByCampaign = async (campaignId) => {
    const url = 'https://graphigo.prd.galaxy.eco/query'

    const query = `
            query campaignParticipants($id: ID!, $pfirst: Int!, $pafter: String!) {
                campaign(id: $id) {
                id
                numberID
                participants() {
                    participants(first: $pfirst, after: $pafter) {
                    list {
                        address {
                            id
                            address
                            twitterUserName
                            discordUserName
                        }
                        points
                    }
                    }
                    participantsCount
                }
                }
            }`;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GALXE_ACCESS_TOKEN}`
    };

    let allUsers = [];
    let hasNextPage = true;
    let variables = {
        "id": campaignId,
        "pfirst": 1000,
        "pafter": "-1"
    }
    let totalCount = 0

    while (hasNextPage) {
        const users = await postQuery(url, query, variables, headers)
            .then(data => {
                if (!data?.data?.campaign) {
                    throw { "error": "No campaign data returned", "response": JSON.stringify(data, null, 2) }
                }
                totalCount = data.data.campaign.participants.participantsCount

                const users = data.data.campaign.participants.participants.list
                return users.map(user => ({
                    address: user.address.address, points: user.points
                }));
            })

        allUsers = allUsers.concat(users)
        hasNextPage = allUsers.length < totalCount
        variables.pafter = allUsers.length - 1
    }

    return { users: allUsers, count: totalCount }
}