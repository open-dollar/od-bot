import prisma from "../prisma.js";
import { postQuery } from '../utils.js';

const CAMPAIGNS = [
    "GCZ5VtdiPE",
    "GCNdVtdWfe",
    "GCQxktdaW3",
    "GCF8AtzQCb",
    "GCJGCth5pr",
    "GCdxTt4qft",
    "GCNcLtwF8M",
    "GCKestwhC4",
    "GC4VktwZup",
    "GC2Gntt749",
    "GCHpqttjuU",
    "GCBMqttiLn",
    "GC1zyttiF4",
    "GCf3dtttvj",
    "GCmBdttw2P",
    "GCYpzttGyA",
    "GCYezttCsB",
    "GCZwzttqSm",
    "GCoUetUkhM",
    "GC2YeU3CBN",
    "GCTD8tUgCV",
    "GCyjwtUJi3",
    "GCi85U3mjQ",
    "GC771UnoPT",
    "GCejKUnxR2",
    "GChseU36N7",
    "GCR17UMGrb",
    "GCi47UMqPk"
]

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

// TODO: Waiting on support.
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

export const fetchGalxeUsersByCampaign = async (campaignId) => {
    const query = `
    query campaignParticipants($id: ID!, $pfirst: Int!, $pafter: String!) {
        campaign(id: $id) {
            id
            numberID
            space {
            id
            }
            participants {
            participants(first: $pfirst, after: $pafter) {
                pageInfo {
                endCursor
                hasNextPage
                }
                list {
                address {
                    address
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

    while (hasNextPage) {
        const response = await galxeGraphqlQuery(query, variables)
        if (!response?.data?.campaign)
            throw { "error": "No galxe data returned", "response": JSON.stringify(response, null, 2) }

        const users = response.data.campaign.participants.participants.list

        allUsers = allUsers.concat(users)
        hasNextPage = response.data.campaign.participants.participants.pageInfo.hasNextPage
        variables.pafter = allUsers.length - 1
    }
    const uniqueUsers = allUsers.map(user => ({ ...user, address: user.address.address.toLowerCase() })).filter((user) => user.address)
    return { users: uniqueUsers }
}


export const fetchGalxeUsers = async () => {
    const campaignIds = await fetchAllCampaigns()

    let aggregatedUsers = []
    // for (const campaignId of campaignIds) {
    for (const campaignId of CAMPAIGNS) {
        // async function delay(ms) {
        //     return new Promise(resolve => setTimeout(resolve, ms));
        // }
        // await delay(2000)
        // console.log(`Galxe: Fetching campaign ${campaignId}`)
        const { users } = await fetchGalxeUsersByCampaign(campaignId)
        console.log(`Galxe: Campaign ${campaignId} users: ${users.length}`)
        users.forEach(newUser => {
            const existingUserIndex = aggregatedUsers.findIndex(user => user.address === newUser.address);
            if (existingUserIndex !== -1) {
                aggregatedUsers[existingUserIndex].points += newUser.points;
            } else {
                aggregatedUsers.push({ address: newUser.address, points: newUser.points });
            }
        });
    }

    const totalCount = aggregatedUsers.length
    console.log(`Galxe: Total users: ${totalCount}`)
    return { users: aggregatedUsers, uniqueCount: totalCount, totalCount }
}

export const fetchGalxeUser = async (address) => {
    const { users } = await fetchGalxeUsers()

    const user = users.find(user => user.address === address)
    if (!user) console.log(`User not found in Galxe: ${address}`)
    return user
}