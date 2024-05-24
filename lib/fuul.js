const FUUL_API_KEY = process.env.FUUL_API_KEY

const HEADERS = {
    'Authorization': `Bearer ${process.env.FUUL_API_KEY}`,
    "content-type": "application/json",
};

const postFuul = async (url, body) => {
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: HEADERS,
    })
}

const fetchFuul = async (url) => {
    return fetch(url, {
        method: "GET",
        headers: HEADERS,
    }).then(data => {
        console.log(`Fuul response: ${data.status} ${data.statusText}`)
        return data.json()
    }).catch(error => {
        console.error(error);
    });
}

const fetchFuulPagination = async (url) => {
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
                    throw { "error": "No campaign data returned", "response": JSON.stringify(data, null, 2) }

                totalCount = data.total_results

                return data.results
            })

        allItems = allItems.concat(items)
        hasNextPage = allItems.length < totalCount
        page += 1
        urlWithParams.searchParams.set('page', page);
    }
    return allItems
}




export const giveFuulPoints = async (users) => {
    const url = "https://api.fuul.xyz/api/v1/events/batch"
    const payloads = users.map(user => {
        return {
            args: {
                points: {
                    amount: user.points,
                    currency: "POINT",
                },
            },
            name: "socialPoints",
            user_address: user.address,
            timestamp: new Date().getTime(),
            dedup_id: `${user.address}-${new Date().getTime()}`
        }
    })

    postFuul(url, payloads).then(data => {
        console.log(`Fuul payloads sent: ${payloads.length}`)
        console.log(`Fuul response: ${data.status} ${data.statusText}`)
    })
        .catch(error => {
            console.error(error);
        });
}

export const getUserFuulData = async (user_address) => {
    try {
        const url = `https://api.fuul.xyz/api/v1/payouts?type=point&user_address=${user_address}`

        const items = await fetchFuulPagination(url)
        return items
    } catch (error) {
        console.debug('No user data found:', error)
        return null
    }
}

// Unfinised but pagination is working
export const getLeaderboard = async () => {
    const url = `https://api.fuul.xyz/api/v1/payouts/leaderboard`

    const items = await fetchFuulPagination(url)

    const users = items.slice(0, 100).map(item => ({
        address: item.address,
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
