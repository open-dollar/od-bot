import { getUserDeposits } from "../../lib/userDeposits"

const ARBITRUM = "ARBITRUM"

export default async function handler(request, response) {
    try {
        let network = ARBITRUM
        if (request.query.network) network = request.query.network

        const { address } = request.query

        if (!address) {
            return response.status(400).json({ success: false, error: "Address parameter is required" })
        }

        const result = await getUserDeposits(address, network)

        response.status(200).json({ success: true, totalCollateralInUSD: result.totalCollateralInUSD })
    } catch (e) {
        console.error(e)
        response.status(500).json({ success: false, error: e.message })
    }
}