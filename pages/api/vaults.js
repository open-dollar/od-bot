import { getVaults } from "../../lib/vaults"
import { setCorsHeaders } from "../../lib/cors";

const ARBITRUM = "ARBITRUM";

export default async function handler(request, response) {
    setCorsHeaders(request, response);

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