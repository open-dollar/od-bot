import prisma from "./prisma";
import { getQuery } from './utils';

export const updateZealyPointsForAllUsers = async () => {
    const communityId = "GCHpqttjuU"
    const users = await fetchZealyUsersByCommunity("opendollar")
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
                if (!data?.data) {
                    throw { "error": "No campaign data returned", "response": JSON.stringify(data, null, 2) }
                }

                // console.log(data)

                totalCount = data.totalRecords

                const users = data.data
                return users.map(user =>
                    ({ address: user.address, points: user.xp })
                )
            })

        allUsers = allUsers.concat(users)
        hasNextPage = allUsers.length < totalCount
        page += 1
        urlWithParams.searchParams.set('page', page);
    }
    return allUsers
}