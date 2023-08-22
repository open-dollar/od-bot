import { NextApiRequest, NextApiResponse } from 'next';
import { getAuctionsList } from "../../lib/web3/geb";
import { getBlockNumber } from "../../lib/components/common";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        const blockNumber = await getBlockNumber(30000);

        // Extract tokenSymbol from the request body.
        const { tokenSymbol } = request.body;

        if (!tokenSymbol) {
            return response.status(400).json({ error: 'tokenSymbol must be provided in the request body.' });
        }

        const auctions = await getAuctionsList(tokenSymbol, blockNumber)
        
        // Send response.
        response.status(200).json({ status: 'success', auctions: auctions });
    } catch (error) {
        console.error('API error:', error);
        response.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
