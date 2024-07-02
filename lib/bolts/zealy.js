import { getQuery } from '../utils.js';

const ZEALY_COMMUNITY_ID = "opendollar"

export const fetchZealyUsers = async () => {
    const headers = {
        'x-api-key': process.env.ZEALY_IO_API_KEY,
    };

    const url = `https://api-v2.zealy.io/public/communities/${ZEALY_COMMUNITY_ID}/leaderboard`

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

    const aggregatedUsers = allUsers.filter(user => user.address).reduce((acc, newUser) => {
        const existingUser = acc.find(user => user.address === newUser.address);
        if (existingUser) {
            existingUser.points += newUser.points;
        } else {
            acc.push({ address: newUser.address, points: newUser.points });
        }
        return acc;
    }, []);

    return { users: aggregatedUsers, uniqueCount: aggregatedUsers.length, totalCount: allUsers.length }
}

export const fetchZealyUser = async (address) => {
    const { users } = await fetchZealyUsers()
    const user = users.find(user => user.address === address)
    if (!user) console.log(`User not found in Zealy: ${address}`)
    return user
}