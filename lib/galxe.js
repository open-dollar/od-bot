import prisma from "./prisma.js";
import { postQuery } from './utils.js';

const CAMPAIGNS = ["GCHpqttjuU", "GCJGCth5pr", "GCQxktdaW3", "GCQxktdaW3", "GCNdVtdWfe"]

export const fetchGalxeUsers = async () => {

    let aggregatedUsers = []

    for (const campaignId of CAMPAIGNS) {
        const { users } = await fetchGalxeUsersByCampaign(campaignId)
        users.forEach(newUser => {
            const existingUserIndex = aggregatedUsers.findIndex(user => user.address === newUser.address);
            if (existingUserIndex !== -1) {
                aggregatedUsers[existingUserIndex].points += newUser.points;
            } else {
                aggregatedUsers.push({ address: newUser.address.toLowerCase(), points: newUser.points });
            }
        });
    }

    const totalCount = aggregatedUsers.length
    return { users: aggregatedUsers, uniqueCount: totalCount, totalCount }
}

export const fetchGalxeUsersByCampaign = async (campaignId) => {
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
    return { users: uniqueUsers }
}

export const fetchGalxeUser = async (address) => {
    let aggregatedUsers = []

    for (const campaignId of CAMPAIGNS) {
        const { users } = await fetchGalxeUsersByCampaign(campaignId)
        users.forEach(newUser => {
            const existingUserIndex = aggregatedUsers.findIndex(user => user.address === newUser.address);
            if (existingUserIndex !== -1) {
                aggregatedUsers[existingUserIndex].points += newUser.points;
            } else {
                aggregatedUsers.push({ address: newUser.address, points: newUser.points });
            }
        });
    }

    const user = aggregatedUsers.find(user => user.address === address)
    if (!user) console.log(`User not found in Galxe: ${address}`)
    return user
}