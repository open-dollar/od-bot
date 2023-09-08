import { getUser } from "../../lib/web3/user";

const ARBITRUM_GOERLI = "ARBITRUM_GOERLI";

export default async function handler(request, response) {
  if (request.query.secret !== process.env.RATE_SECRET) {
    response.status(404).end();
    return;
  }
  let network = ARBITRUM_GOERLI;
  if (request.query.network) network = request.query.network;

  await getUser(network, request.query.address);

  response.status(200).json({ success: true });
}
