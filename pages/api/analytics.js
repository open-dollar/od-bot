import { getStats, getAuctionData } from "../../lib/web3/analytics";

const ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

export default async function handler(request, response) {
  try {
    let network = ARBITRUM_SEPOLIA;
    if (request.query.network) network = request.query.network;
    const stats = await getStats(network, false, request.query.channel);
    await stats.save();

    if (request.query.channel) {
      response.status(200).json({ success: true });
    } else {
      response.status(200).json(stats);
    }

  } catch (e) {
    console.log(e);
    return response.status(500).json({ success: false, error: e.message });
  }
}
