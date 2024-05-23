import prisma from "./prisma";
import { postQuery } from './utils';
import { giveFuulPoints } from './fuul';

export const updateGalxePointsForAllUsers = async (campaignId) => {
    const campaignIds = ["GCHpqttjuU", "GCJGCth5pr", "GCQxktdaW3"]

    let aggregatedUsers = []

    for (const campaignId of campaignIds) {
        const { users, count } = await fetchGalxeUsersByCampaign(campaignId)
        users.forEach(newUser => {
            const existingUserIndex = aggregatedUsers.findIndex(user => user.address === newUser.address);
            if (existingUserIndex !== -1) {
                aggregatedUsers[existingUserIndex].points += newUser.points;
            } else {
                aggregatedUsers.push({ address: newUser.address, points: newUser.points });
            }
        });
    }

    let usersWithNewPoints = await updateUsersAndGetNewPoints(aggregatedUsers)

    console.log(`Updating ${usersWithNewPoints.length} Galxe users out of ${aggregatedUsers.length}`)

    // For testing purposes
    usersWithNewPoints.push({ address: "0x000000000000000000000000000000000000dead", points: 1337 })

    await giveFuulPoints(usersWithNewPoints)

    return { updated: usersWithNewPoints.length, total: aggregatedUsers.length }
}

const updateUsersAndGetNewPoints = async (users) => {
    let usersWithNewPoints = []
    for (const user of users) {
        let newPoints = 0

        const existingUser = await prisma.user.findUnique({
            where: { id: user.address }
        })

        if (!existingUser) {
            await prisma.user.create({
                data: { id: user.address, galxePoints: user.points }
            })
            newPoints = user.points
        } else if (existingUser.galxePoints !== user.points) {
            await prisma.user.update({
                where: { id: user.address, },
                data: { galxePoints: user.points }
            })
            newPoints = existingUser.galxePoints - user.points
        } else {
            // No change in points
        }

        // Only when points increase
        if (newPoints > 0)
            usersWithNewPoints.push({ address: user.address, points: newPoints })
    }
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
                if (!data?.data?.campaign)
                    throw { "error": "No campaign data returned", "response": JSON.stringify(data, null, 2) }

                totalCount = data.data.campaign.participants.participantsCount

                const users = data.data.campaign.participants.participants.list
                return users.map(user => ({ address: user.address.address, points: user.points }));
            })

        allUsers = allUsers.concat(users)
        hasNextPage = allUsers.length < totalCount
        variables.pafter = allUsers.length - 1
    }
    const uniqueUsers = allUsers.filter(user => user.address)
    return { users: uniqueUsers, count: uniqueUsers.length }
}