import type { NextApiRequest, NextApiResponse } from "next";

import { getGasBalance } from "../../lib/web3/gas";
import { updateRate, getCollateralStats } from "../../lib/web3/geb";
import { updateFeed } from "../../lib/web3/oracle";
import { OP } from "@usekeyp/od-sdk/lib/utils";

const OPTIMISM_GOERLI = "OPTIMISM_GOERLI";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.query.secret !== process.env.RATE_SECRET) {
    response.status(404).end();
    return;
  }

  await updateRate(OPTIMISM_GOERLI);
  // await updateFeed(OPTIMISM_GOERLI);
  // await getCollateralStats(OPTIMISM_GOERLI);
  response.status(200).json({ success: true });
}
