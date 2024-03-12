import { getAuctionData } from "../../lib/web3/auction";

const ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

export default async function handler(request, response) {
  try {
    let network = ARBITRUM_SEPOLIA;
    if (request.query.network) network = request.query.network;

    await getAuctionData(network, request.query.channel);

    response.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    return response.status(500).json({ success: false, error: e.message });
  }
}
