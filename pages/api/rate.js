import { updateRate } from "../../lib/web3/rate";

const ARBITRUM_GOERLI = "ARBITRUM_GOERLI";

export default async function handler(request, response) {
  if (request.query.secret !== process.env.RATE_SECRET) {
    response.status(401).end();
    return;
  }

  let network = ARBITRUM_GOERLI;
  if (request.query.network) network = request.query.network;
  await updateRate(network);

  response.status(200).json({ success: true });
}
