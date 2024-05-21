const FUUL_API_KEY = process.env.FUUL_API_KEY

const getQuery = (url, body, headers) => {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
    })
        .then(data => {
            return data;
        })
}

export const giveFuulPoints = async (users) => {
    const url = "https://api.fuul.xyz/api/v1/events/batch"

    const payloads = users.map(user => {
        return {
            args: {
                points: {
                    amount: user.points,
                    currency: "POINTS",
                },
            },
            name: "socialPoints",
            user_address: user.address,
            timestamp: new Date().getTime(),
            dedup_id: `${user.address}-${new Date().getTime()}`
        }
    })

    const headers = {
        'Authorization': `Bearer ${process.env.FUUL_API_KEY}`,
        "content-type": "application/json",
    };

    getQuery(url, payloads, headers)
        .then(data => {
            console.log(data.status)
            console.log(data.statusText)
        })
        .catch(error => {
            console.error(error);
        });
}
