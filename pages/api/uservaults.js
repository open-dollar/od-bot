// import { postQuery } from "../../lib/apollo-client";

const ARBITRUM = "ARBITRUM";

export default async function handler(request, response) {
    try {
        let network = ARBITRUM;
        if (request.query.network) network = request.query.network;

        const { address } = request.query;
        if (!address) {
            return response.status(400).json({ success: false, error: "Address parameter is required" });
        }

        const data = { data: { vaults: [] } };
        // const data = await postQuery(`
        //     query MyQuery($address: String!) {
        //         vaults(where: {owner: $address}) {
        //             id
        //             collateralType
        //             collateral
        //             debt
        //             genesis
        //         }
        //     }`,
        //     { address },
        //     network
        // );

        if (data.errors) {
            throw new Error(data.errors.map(error => error.message).join(", "));
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