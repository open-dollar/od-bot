import { postQuery } from "../../queries";
import { initGeb } from "../../lib/web3/geb";

const ARBITRUM = "ARBITRUM";

export default async function handler(request, response) {
    try {
        let network = ARBITRUM;
        if (request.query.network) network = request.query.network;

        const { address } = request.query;

        if (!address) {
            return response.status(400).json({ success: false, error: "Address parameter is required" });
        }

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

        response.status(200).json({ success: true, details });
    } catch (e) {
        console.error(e);
        response.status(500).json({ success: false, error: e.message });
    }
}