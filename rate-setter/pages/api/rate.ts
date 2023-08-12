import type { NextApiRequest, NextApiResponse } from "next";

import { getGasBalance } from "../../lib/web3/gas";
import { updateRate } from "../../lib/web3/geb";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.query.secret !== process.env.RATE_SECRET) {
    response.status(404).end();
    return;
  }
  await updateRate("OPTIMISM-GOERLI");
  response.status(200).json({ success: true });
}
