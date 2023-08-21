import { NextApiRequest, NextApiResponse } from 'next';
import { Geb, utils } from "@usekeyp/od-sdk";
import { useLiquidateSAFE } from "../../lib/web3/geb";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    const { safeAddress } = request.body;

    if (!safeAddress) {
        // No address, return error
        return response.status(400).json({ error: 'safeAddress is required' });
    }

    try {
        // Perform safe liquidation with the given safeAddress, make variable for arb
        const tx = await useLiquidateSAFE('OPTIMISM_GOERLI', safeAddress);

        response.status(200).json({ success: true, tx: tx });
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
};