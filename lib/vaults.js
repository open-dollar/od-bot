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
            genesis
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

    return data.data.vaults.sort((a, b) =>
        Number(a.id) - Number(b.id)
    )
}


export const getUserVaults = async (address, network) => {
    let geb;
    try {
        geb = initGeb(network);
        if (!geb) {
            throw new Error('Failed to initialize GEB');
        }
    } catch (e) {
        return response.status(500).json({ success: false, error: 'Failed to initialize GEB' });
    }

    const query = `
            query MyQuery($address: String!) {
                vaults(where: { owner: $address }) {
                    id
                    collateralType
                    collateral
                    debt
                    genesis
                }
            }
        `;

    const variables = { address };
    const headers = {
        'Content-Type': 'application/json'
    };

    const data = await postQuery(geb.subgraph, query, variables, headers);

    if (data.errors) {
        throw new Error(data.errors.map(error => error.message).join(", "));
    }

    if (!data.data || !data.data.vaults) {
        throw new Error("No data received or data structure is incorrect.");
    }

    let vaultsByCollateral = {};

    data.data.vaults.forEach(vault => {
        if (!vaultsByCollateral[vault.collateralType]) {
            vaultsByCollateral[vault.collateralType] = [];
        }
        vaultsByCollateral[vault.collateralType].push(vault.id);
    });

    const details = {
        vaults: data.data.vaults,
        vaultsByCollateral
    };

    return details
}