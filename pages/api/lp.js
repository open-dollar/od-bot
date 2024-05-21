import { getTotalLpBalance } from '../../lib/web3/lp';
import {formatUnits} from "@ethersproject/units";

const ARBITRUM = "ARBITRUM";

export default async function handler(request, response) {
    try {
        // Only Arbitrum for now because there aren't pools to query for other networks
        let network = ARBITRUM;

        const { token } = request.query;

        if (!token) {
            return response.status(400).json({ success: false, error: "Token parameter is required" });
        }

        const totalBalance = await getTotalLpBalance(network, token);

        const formattedBalance = formatUnits(totalBalance.toString(), 18);

        response.status(200).json({ success: true, totalBalance: formattedBalance });
    } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
    }
}