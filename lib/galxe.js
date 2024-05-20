import { postQuery } from './utils';
import prisma from "./prisma";

export const updateGalxePointsForAllUsers = async () => {
    const campaignId = "GCHpqttjuU"
    const users = await fetchGalxeUsersByCampaign(campaignId)
    console.log(users)
}

// model galxeUser {
//     id String @id // address
//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt
//     points Int @default(0)
//   }

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
            query campaignParticipants($id: ID!, $pfirst: Int!) {
                campaign(id: $id) {
                id
                numberID
                participants() {
                    participants(first: $pfirst) {
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
            }
            `;
    const variables = {
        "id": campaignId,
        "pfirst": 5000
    }
    const headers = {
        // 'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    return postQuery(url, query, variables, headers)
        .then(data => {
            const users = data.data.campaign.participants.participants.list
            return users.map(user => ({
                address: user.address.address, points: user.points
            }));
        })
        .catch(error => {
            console.error(error);
        })
}