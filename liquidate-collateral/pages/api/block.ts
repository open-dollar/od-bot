import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from 'ethers';

// Server sanity check endpoint

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        // Create a provider instance connected to the Ethereum mainnet
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

        // Fetch the block number directly from the provider
        const blockNumber = await provider.getBlockNumber();

        response.status(200).json({ blockNumber: blockNumber.toString() });
    } catch (error) {
        console.error('API error:', error);
        response.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
