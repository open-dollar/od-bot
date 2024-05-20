import { postQuery } from './utils';
import prisma from "./prisma";

export const updateGalxePointsForAllUsers = async () => {
    const campaignId = "GCHpqttjuU"
    const users = await fetchGalxeUsersByCampaign(campaignId)
    // console.log(users)
}

const updateUserPoints = async (address, points) => {
    let newPoints = 0
    const user = await prisma.galxeUser.findUnique({
        where: { id: address }
    })
    if (!user) {
        await prisma.galxeUser.create({
            id: address,
        })
    } else {
        newPoints = points - user.points
        await prisma.galxeUser.update({
            where: { id: address, }, data: {
                points
            }
        })
    }

    if (newPoints > 0)
        await giveFuulPoints("galxe", newPoints)

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
        'Content-Type': 'application/json'
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

        hasNextPage = allUsers.length < totalCount
        allUsers = allUsers.concat(users)
        variables.pafter = allUsers.length - 1
    }

    return allUsers
}