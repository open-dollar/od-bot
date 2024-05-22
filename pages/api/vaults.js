import { postQuery } from "../../lib/apollo-client";

const ARBITRUM = "ARBITRUM";

export default async function handler(request, response) {
    try {
        let network = ARBITRUM;
        if (request.query.network) network = request.query.network;

        const data = await postQuery(`
            query AllUsers {
                vaults(first:1000) {
                id
                owner
                collateral
                debt
                collateralType
                }
            }`,
            {}, network);

        if (data.errors) {
            throw new Error(data.errors.map(error => error.message).join(", "));
        }

        let owners = [];
        let vaultsByOwner = {};
        let vaultsByCollateral = {};

        data.data.vaults.forEach(vault => {
            if (!owners.includes(vault.owner)) owners.push(vault.owner);
            if (!vaultsByOwner[vault.owner]) vaultsByOwner[vault.owner] = [];
            vaultsByOwner[vault.owner].push(vault.id);
            if (!vaultsByCollateral[vault.collateralType]) vaultsByCollateral[vault.collateralType] = [];
            vaultsByCollateral[vault.collateralType].push(vault.id);
        });

        const details = {
            vaults: data.data.vaults,
            owners: owners,
            vaultsByOwner,
            vaultsByCollateral
        };

        response.status(200).json({ success: true, details });
    } catch (e) {
        console.error(e);
        response.status(500).json({ success: false, error: e.message });
    }
}