import { getStats, getAuctionData } from "../../lib/web3/analytics";

const ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

export default async function handler(request, response) {
  try {
    if (request.query.secret !== process.env.RATE_SECRET) {
      response.status(401).end();
      return;
    }
    let network = ARBITRUM_SEPOLIA;
    if (request.query.network) network = request.query.network;

    const stats = await getStats(network);
    await stats.save();

    response.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    return response.status(500).json({ success: false, error: e.message });
  }
}
