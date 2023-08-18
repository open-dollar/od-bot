import { getStats } from "../../lib/web3/analytics/analytics";

const OPTIMISM_GOERLI = "OPTIMISM_GOERLI";

export default async function handler(
    request,
    response
) {
    if (request.query.secret !== process.env.RATE_SECRET) {
        response.status(404).end();
        return;
    }

    await getStats(OPTIMISM_GOERLI);
    response.status(200).json({ success: true });
}
