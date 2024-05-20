const dotenv = require('dotenv').config()

const getQuery = (url, payload, headers) => {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify({ payload }),
        headers,
    })
        .then(r => r.json())
        .then(data => {
            return data;
        })
}

const headers = {
    'AUTHORIZATION': `Bearer ${process.env.FUUL_API_KEY}`,
    "content-type": "application/json",
};

url = "https://api.fuul.xyz/api/v1/events"

const payload = {
    "args": {
        "value": {
            "amount": "100",
            "currency": "POINTS"
        },
    },
    "name": "galxe",
    "user_address": "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
    "timestamp": new Date().getTime()
}

getQuery(url, payload, headers)
    .then(data => {
        console.log(data)
    })
    .catch(error => {
        console.error(error);
    });