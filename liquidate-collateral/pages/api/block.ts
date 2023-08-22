import type { NextApiRequest, NextApiResponse } from "next";
import { JsonRpcProvider } from 'ethers/providers';

// Server sanity check endpoint

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        // Create a provider instance connected to the Ethereum mainnet
        const provider = new JsonRpcProvider(process.env.RPC_URL);

        // Fetch the block number directly from the provider
        const blockNumber = await provider.getBlockNumber();

        response.status(200).json({ blockNumber: blockNumber.toString() });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};
