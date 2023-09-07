import { updateTokenPrice } from "../../lib/web3/token";

const ARBITRUM_GOERLI = "ARBITRUM_GOERLI";

export default async function handler(request, response) {
  if (request.query.secret !== process.env.RATE_SECRET) {
    response.status(404).end();
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
}
