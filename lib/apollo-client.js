import { ApolloClient, InMemoryCache } from '@apollo/client'
import fetch from "node-fetch";
import {Geb} from "@opendollar/sdk";
import {initGeb} from "./web3/geb";

export const client = new ApolloClient({
    uri: '/api/graphql',
    cache: new InMemoryCache(),
})

export const postQuery = (query, variables, network) => {
    const geb = initGeb(network);
    return fetch(geb.subgraph, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables
        }),
    })
        .then(r => r.json())
        .then(data => {
            return data;
        })
}

