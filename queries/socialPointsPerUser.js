const dotenv = require('dotenv').config()

const ZEALY_COMMUNITY_ID = "opendollar"
const CAMPAIGNS = ["GCHpqttjuU", "GCJGCth5pr", "GCQxktdaW3", "GCNdVtdWfe"]
const { postQuery, getQuery } = require('../lib/utils')

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
    return { users: uniqueUsers }
}

const fetchGalxeUser = async (address) => {
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

const fetchZealyUsersByCommunity = async (communityId) => {
    const headers = {
        'x-api-key': process.env.ZEALY_IO_API_KEY,
    };

    const url = `https://api-v2.zealy.io/public/communities/${communityId}/leaderboard`

    let allUsers = [];
    let hasNextPage = true;
    let totalCount = 0
    let page = 1

    const urlWithParams = new URL(url)
    urlWithParams.searchParams.set('page', page);

    while (hasNextPage) {
        const users = await getQuery(urlWithParams, headers)
            .then(data => {
                if (!data?.data)
                    throw { "error": "No campaign data returned", "response": JSON.stringify(data, null, 2) }

                totalCount = data.totalRecords

                const users = data.data
                return users.map(user => {
                    let address = user.ethAddress?.toLowerCase()
                    if (!address)
                        address = user.address?.toLowerCase()
                    if (!address)
                        address = user.connectedWallet?.toLowerCase()
                    return ({ address, points: user.xp })
                })
            })

        allUsers = allUsers.concat(users)
        hasNextPage = allUsers.length < totalCount
        page += 1
        urlWithParams.searchParams.set('page', page);
    }
    const uniqueUsers = allUsers.filter(user => user.address)
    return { users: uniqueUsers, uniqueCount: uniqueUsers.length, totalCount: allUsers.length }
}

const fetchZealyUser = async (address) => {
    const { users } = await fetchZealyUsersByCommunity(ZEALY_COMMUNITY_ID)
    const user = users.find(user => user.address === address)
    if (!user) console.log(`User not found in Zealy: ${address}`)
    return user
}

const socialPointsPerUser = async (address) => {
    console.log(`User: ${address}`)
    const galxeUser = await fetchGalxeUser(address)
    if (galxeUser) console.log(`Galxe Points: ${galxeUser.points || 0}`)

    const zealyUser = await fetchZealyUser(address)
    if (zealyUser) console.log(`Zealy Points: ${zealyUser.points || 0}`)
}

const USER_ADDRESS = "0x052d62a6479E3C027AFFf55385F2ba53ffe8ba58".toLowerCase()
socialPointsPerUser(USER_ADDRESS)