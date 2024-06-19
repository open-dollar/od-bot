export const postQuery = (url, query, variables, headers) => {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            query,
            variables
        }),
        headers,
    })
        .then(r => {
            if (r.status !== 200) throw new Error(r.statusText)
            return r.json()
        })
        .then(data => {
            return data;
        })
}



export const getQuery = (url, headers) => {
    return fetch(url, {
        method: 'GET',
        headers,
    })
        .then(r => r.json())
        .then(data => {
            return data;
        })
}
