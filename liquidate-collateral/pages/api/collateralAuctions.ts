import { NextApiRequest, NextApiResponse } from 'next';
import { JsonRpcProvider } from 'ethers/providers';

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        // Fetch the current block number from the /api/block endpoint.
        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        const fromBlock = blockNumber.toString();

        // Extract tokenSymbol from the request body.
        const { tokenSymbol } = request.body;

        if (!tokenSymbol) {
            return response.status(400).json({ error: 'tokenSymbol must be provided in the request body.' });
        }

        // Start fetching auctions here.
        // 

        // Log the fetched auctions.
        console.log(tokenSymbol);

        // Send response.
        response.status(200).json({ status: 'success', tokenSymbol: tokenSymbol });
    } catch (error) {
        console.error('API error:', error);
        response.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};