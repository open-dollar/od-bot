import prisma from "./prisma";
import { getQuery } from './utils';
import { giveFuulPoints, EVENT_NAME_SOCIAL_POINTS } from './fuul';


export const updateZealyPointsForAllUsers = async () => {
    const communityId = "opendollar"
    const { users, uniqueCount, totalCount } = await fetchZealyUsersByCommunity(communityId)

    let usersWithNewPoints = await updateUsersAndGetNewPoints(users)

    console.log(`Zealy usersWithNewPoints: ${usersWithNewPoints.length}. Unique users: ${uniqueCount}. Total users ${totalCount}`)

    // For testing purposes
    usersWithNewPoints.push({ address: "0x0000000000000000000000000000000000000000", points: 420 })

    await giveFuulPoints(usersWithNewPoints, EVENT_NAME_SOCIAL_POINTS)

    return { updated: usersWithNewPoints.length, unique: uniqueCount, total: totalCount }
}

const updateUsersAndGetNewPoints = async (users) => {
    let usersWithNewPoints = []
    for (const user of users) {
        let newPoints = 0

        const existingUser = await prisma.user.findUnique({
            where: { id: user.address.toLowerCase() }
        })

        if (!existingUser) {
            await prisma.user.create({
                data: { id: user.address.toLowerCase(), zealyPoints: user.points }
            })
            newPoints = user.points
        } else if (existingUser.zealyPoints !== user.points) {
            await prisma.user.update({
                where: { id: user.address.toLowerCase(), },
                data: { zealyPoints: user.points }
            })
            newPoints = existingUser.zealyPoints - user.points
        } else {
            // No change in points
        }

        // Only when points increase
        if (newPoints > 0)
            usersWithNewPoints.push({ address: user.address, points: newPoints })
    }
    return usersWithNewPoints
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