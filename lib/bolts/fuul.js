export const EVENT_NAME_SOCIAL_POINTS = "socialPoints"
export const EVENT_NAME_OD_ETH_LP = "OD-ETHCamelot"
export const EVENT_NAME_ODG_ETH_LP = "ODG-ETHCamelot"

const postFuul = async (url, body) => {
    const HEADERS = {
        'Authorization': `Bearer ${process.env.FUUL_API_KEY}`,
        "content-type": "application/json",
    };
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: HEADERS,
    })
}

const fetchFuul = async (url) => {
    const HEADERS = {
        'Authorization': `Bearer ${process.env.FUUL_API_KEY}`,
        "content-type": "application/json",
    };
    return fetch(url, {
        method: "GET",
        headers: HEADERS,
    }).then(data => {
        // console.log(`Fuul response: ${data.status} ${data.statusText}`)
        return data.json()
    }).catch(error => {
        console.error(error);
    });
}

export const fetchFuulPagination = async (url, limit = Infinity) => {
    let allItems = [];
    let hasNextPage = true;
    let totalCount = 0
    let page = 1

    const urlWithParams = new URL(url)
    urlWithParams.searchParams.set('page', page);

    while (hasNextPage) {
        const items = await fetchFuul(urlWithParams)
            .then(data => {
                if (!data?.results)
                    throw { "error": "No fuul data returned", "response": JSON.stringify(data, null, 2) }

                totalCount = data.total_results

                return data.results
            })

        allItems = allItems.concat(items)
        hasNextPage = allItems.length < totalCount && allItems.length < limit
        page += 1
        urlWithParams.searchParams.set('page', page);
    }
    return allItems.slice(0, limit)
}

export const giveFuulPoints = async (users, eventName) => {
    const currencyByEventName = {
        [EVENT_NAME_SOCIAL_POINTS]: "POINT",
        [EVENT_NAME_OD_ETH_LP]: "ETH",
        [EVENT_NAME_ODG_ETH_LP]: "ETH",
    }
    const currency = currencyByEventName[eventName]
    if (!currency)
        throw new Error(`No currency found for event: ${eventName}`)
    const url = "https://api.fuul.xyz/api/v1/events/batch"
    let payloads = users.map(user => ({
        args: { value: { amount: user.points, currency } },
        name: eventName,
        user_address: user.address,
        timestamp: new Date().getTime(),
        dedup_id: `${user.address}-${new Date().getTime()}`
    }))
    return console.log(payloads.length)
    postFuul(url, payloads).then(data => {
        console.log(`Fuul payloads sent: ${payloads.length}`)
        console.log(`Fuul response: ${data.status} ${data.statusText}`)
        console.log(`Fuul response: ${JSON.stringify(data, null, 2)}`)
    })
        .catch(error => {
            console.error(error);
        });
}

export const getUserFuulData = async (user_address) => {
    try {
        const url = `https://api.fuul.xyz/api/v1/payouts?type=point&user_address=${user_address}`

        const conversions = await fetchFuulPagination(url)
        const leaderboard = await getLeaderboard(user_address)
        return {
            ...leaderboard.users[0],
            conversions
        }
    } catch (error) {
        console.debug('No user data found:', error)
        return null
    }
}

// Unfinished but pagination is working
export const getLeaderboard = async (user_address) => {

    const url = new URL("https://api.fuul.xyz/api/v1/payouts/leaderboard")
    if (user_address)
        url.searchParams.set('user_address', user_address);

    const items = await fetchFuulPagination(url)

    const users = items.map(item => ({
        address: item.address.toLowerCase(),
        points: Number(item.total_amount),
        rank: item.rank,
        attributions: item.total_attributions
    }))
    const totalUsers = items.length
    return {
        users,
        totalUsers
    }
}