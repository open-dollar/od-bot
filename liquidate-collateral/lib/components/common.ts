import { JsonRpcProvider } from 'ethers/providers';

export const getBlockNumber = async (rollback?: number) => {
    // Fetch the current block number from the /api/block endpoint.
    const provider = new JsonRpcProvider(process.env.RPC_URL);
    let blockNumber = await provider.getBlockNumber();
    
    // If rollback value is passed, subtract it from the block number
    if (rollback) {
        blockNumber -= rollback;
    }

    return blockNumber.toString();
};
