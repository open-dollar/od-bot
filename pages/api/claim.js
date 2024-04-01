import { claim } from "../../lib/web3/claim";
import { AVAILABLE_MAINNET_NETWORKS } from "../../lib/web3/common";

const ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

export default async function handler(request, response) {
  try {
    let network = ARBITRUM_SEPOLIA;
    if (request.query.network) network = request.query.network;

    if (AVAILABLE_MAINNET_NETWORKS.has(network)) {
      return response.status(403).json({ success: false, error: '/claim is not allowed for mainnet networks like ' + network})
    }

    await claim(network, request.query.address, request.query.channel);

    response.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    return response.status(500).json({ success: false, error: e.message });
  }
}
