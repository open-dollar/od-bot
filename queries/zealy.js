const dotenv = require('dotenv').config()


const postQuery = (url, headers) => {
    return fetch(url, {
        method: 'GET',
        headers,
    })
        .then(r => r.json())
        .then(data => {
            return data;
        })
}

const headers = {
    'x-api-key': process.env.ZEALY_IO_API_KEY,
};

const url = 'https://api-v2.zealy.io/public/communities/opendollar/leaderboard'
postQuery(url, headers)
    .then(data => {
        console.log(data)
        const users = data.data
        users.forEach(user => {
            console.log(`User: ${user.address}, Points: ${user.xp}`);
        });
    })
    .catch(error => {
        console.error(error);
    });