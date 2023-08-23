import { NextApiRequest, NextApiResponse } from 'next';
import { getAuctionsList } from "../../lib/web3/geb";
import { getBlockNumber } from "../../lib/components/common";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        const blockNumber = await getBlockNumber();

        // tbd 
        
        // Send response.
        response.status(200).json({ status: 'success', blockNumber: blockNumber });
    } catch (error) {
        console.error('API error:', error);
        response.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
