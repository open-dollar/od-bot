const dotenv = require('dotenv').config()

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

const headers = {
    'Authorization': `Bearer ${process.env.FUUL_API_KEY}`,
    "content-type": "application/json",
};

url = "https://api.fuul.xyz/api/v1/events"

user_address = "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5"

const body = {
    args: {
        points: {
            amount: 100,
            currency: "POINTS",
        },
    },
    name: "socialPoints",
    user_address: user_address,
    timestamp: new Date().getTime(),
    dedup_id: `${user_address}-${new Date().getTime()}`
}

getQuery(url, body, headers)
    .then(data => {
        console.log(data.status)
        console.log(data.statusText)
    })
    .catch(error => {
        console.error(error);
    });