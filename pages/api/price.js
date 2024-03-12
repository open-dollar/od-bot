import { updateTokenPrice } from "../../lib/web3/price";

const ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

export default async function handler(request, response) {
  try {
    if (request.query.secret !== process.env.RATE_SECRET) {
      response.status(401).end();
      return;
    }
    let network = ARBITRUM_SEPOLIA;
    if (request.query.network) network = request.query.network;

    await updateTokenPrice(
      network,
      request.query.token,
      request.query.price,
      request.query.execute === "true" ? true : false,
      request.query.channel
    );

    response.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    const errorText = e.message ? e.message : e;
    return response.status(500).json({ success: false, error: errorText });
  }
}
