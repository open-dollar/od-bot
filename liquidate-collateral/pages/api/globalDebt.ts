import { NextApiRequest, NextApiResponse } from 'next';
import { getGlobalDebt } from "../../lib/web3/geb";

export default async function handler(
    request: NextApiRequest,
    response: NextApiResponse
) {
    try {
        // Get global debt.
        const globalDebt = await getGlobalDebt();

        // Send response.
        response.status(200).json({ status: 'success', globalDebt: globalDebt });
    } catch (error) {
        console.error('API error:', error);
        response.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
