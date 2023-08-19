import { getStats } from "../../lib/web3/analytics/analytics";

const ARBITRUM_GOERLI = "ARBITRUM_GOERLI"

export default async function handler(
    request,
    response
) {
    if (request.query.secret !== process.env.RATE_SECRET) {
        response.status(404).end();
        return;
    }
    let network = ARBITRUM_GOERLI
    if (request.query.network) network = request.query.network
    await getStats(network);
    response.status(200).json({ success: true });
}
