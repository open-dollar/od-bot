import { getVaults } from "../../lib/vaults"

const ARBITRUM = "ARBITRUM";

export default async function handler(request, response) {
    try {
        let network = ARBITRUM;
        if (request.query.network) network = request.query.network;

        const details = await getVaults(network)

        response.status(200).json({ success: true, details });
    } catch (e) {
        console.error(e);
        response.status(500).json({ success: false, error: e.message })
    }
}