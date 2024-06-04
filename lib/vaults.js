import { initGeb } from "./web3/geb"
import { postQuery } from "./utils"

export const getVaults = async (network) => {
    let geb
    try {
        geb = initGeb(network)
        if (!geb) {
            throw new Error('Failed to initialize GEB')
        }
    } catch (e) {
        throw new Error('Failed to initialize GEB')
    }

    const query = `query AllUsers {
        vaults(first:1000) {
            id
            owner
            collateral
            debt
            collateralType
        }
    }`

    const variables = {
        "first": 1000
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    const data = await postQuery(geb.subgraph, query, variables, headers)

    if (data.errors) {
        throw new Error(data.errors.map(error => error.message).join(", "))
    }

    return data.data.vaults
}
