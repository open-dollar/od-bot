import prisma from "./prisma.js";
import { postQuery } from './utils.js';

const CAMPAIGNS = ["GCHpqttjuU", "GCJGCth5pr", "GCQxktdaW3", "GCNdVtdWfe"]

const galxeGraphqlQuery = async (query, variables) => {
    try {

        const GALXE_GRAPHQL_URL = 'https://graphigo.prd.galaxy.eco/query'
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GALXE_ACCESS_TOKEN}`
        };
        const response = await postQuery(GALXE_GRAPHQL_URL, query, variables, headers)
        return response
    } catch (e) {
        console.log(e)
    }
}

const fetchAllCampaigns = async () => {
    const query = `
    query CampaignList($id: Int, $campaignInput: ListCampaignInput!) {
        space(id: $id) {
                id
                name
                alias
                campaigns(input: $campaignInput) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                list {
                    id
                    name
                    loyaltyPoints
                    status
                }
            }
        }
    }`

    const variables = {
        "id": 31438,
        "campaignInput": {
            "first": 1000,
            "after": "-1"
        }
    }
    const data = await galxeGraphqlQuery(query, variables)
    return data.data.space.campaigns.list.map(campaign => campaign.id)
}

export const fetchGalxeUsers = async () => {
    const campaignIds = await fetchAllCampaigns()

    let aggregatedUsers = []
    for (const campaignId of campaignIds) {
        console.log(`Fetching users for campaign ${campaignId}`)
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

    let allUsers = [];
    let hasNextPage = true;
    let variables = {
        "id": campaignId,
        "pfirst": 1000,
        "pafter": "-1"
    }
    let totalCount = 0

    while (hasNextPage) {
        const response = await galxeGraphqlQuery(query, variables)
        console.log(response, query, variables)
        if (!response?.data?.campaign)
            throw { "error": "No campaign data returned", "response": JSON.stringify(response, null, 2) }

        totalCount = response.data.campaign.participants.participantsCount

        const users = response.data.campaign.participants.participants.list
        return users.map(user => ({ address: user.address.address, points: user.points }));

        allUsers = allUsers.concat(users)
        hasNextPage = allUsers.length < totalCount
        variables.pafter = allUsers.length - 1
    }
    const uniqueUsers = allUsers.filter(user => user.address)
    return { users: uniqueUsers }
}

export const fetchGalxeUser = async (address) => {
    const { users } = await fetchGalxeUsers()

    const user = users.find(user => user.address === address)
    if (!user) console.log(`User not found in Galxe: ${address}`)
    return user
}