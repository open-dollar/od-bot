import { updateOracles } from "../../lib/web3/oracle";

const ARBITRUM_GOERLI = "ARBITRUM_GOERLI";

export default async function handler(request, response) {
  if (request.query.secret !== process.env.RATE_SECRET) {
    response.status(404).end();
    return;
  }
  let network = ARBITRUM_GOERLI;
  if (request.query.network) network = request.query.network;

  await updateOracles(network);

  response.status(200).json({ success: true });
}
