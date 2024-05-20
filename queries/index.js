
const postQuery = (url, query, variables, headers) => {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            query,
            variables
        }),
        headers,
    })
        .then(r => r.json())
        .then(data => {
            return data;
        })
}

module.exports = {
    postQuery
}
