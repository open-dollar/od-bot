import { ethers } from 'ethers';
import { Geb } from '@hai-on-op/sdk';
import { config } from 'dotenv';
config();

const getBlockNumber = async (provider, rollback) => {
    
    let blockNumber = await provider.getBlockNumber();
    
    // If rollback value is passed, subtract it from the block number
    if (rollback) {
        blockNumber -= rollback;
    }

    return blockNumber.toString();
};

async function main() {
    if(!process.env.RPC_URL) {
        throw new Error('RPC_URL is not defined in environment variables.');
    } else {
        console.log(`Using RPC_URL: ${process.env.RPC_URL}`);
    }

    // Setup Ether.js
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    // Create the main GEB object
    const geb = new Geb('optimism-goerli', provider);

    // Get block number @ 40k blocks ago
    const blockNumber = await getBlockNumber(provider, 40000);

    // Fetch Collateral Auctions
    const collateralAuctionsFetched = await geb.auctions.getCollateralAuctions(Number(blockNumber), 'WETH');
    const collateralAuctions = collateralAuctionsFetched.auctions.map((auction) => {
        return {
            ...auction,
            englishAuctionType: 'COLLATERAL',
            sellToken: 'PROTOCOL_TOKEN',
            buyToken: 'COIN',
            tokenSymbol: 'WETH',
            auctionDeadline: '1699122709',  // This seems to be hardcoded?
        };
    });

    // Log the fetched Collateral Auctions
    console.log(collateralAuctionsFetched);
    console.log(collateralAuctions);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
