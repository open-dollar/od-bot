import { updateTokenPrice } from "../../lib/web3/price";

const ARBITRUM_GOERLI = "ARBITRUM_GOERLI";

export default async function handler(request, response) {
  try {
    if (request.query.secret !== process.env.RATE_SECRET) {
      response.status(401).end();
      return;
    }
    let network = ARBITRUM_GOERLI;
    if (request.query.network) network = request.query.network;

    await updateTokenPrice(
      network,
      request.query.token,
      request.query.price,
      request.query.execute === "true" ? true : false
    );

    response.status(200).json({ success: true });
  } catch (e) {
    console.log(e);
    const errorText = e.message ? e.message : e;
    return response.status(500).json({ success: false, error: errorText });
  }
}
