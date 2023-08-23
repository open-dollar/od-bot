import { ethers } from 'ethers';
import { Geb, utils } from '@hai-on-op/sdk';
import fs from 'fs';
import { config } from 'dotenv';
config();

async function main() {
    if(!process.env.RPC_URL) {
        throw new Error('RPC_URL is not defined in environment variables.');
    } else {
        console.log(`Using RPC_URL: ${process.env.RPC_URL}`);
    }    
    // Setup Ether.js
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PAYER_WALLET_PRIVATE_KEY, provider);

    // Create the main GEB object
    const geb = new Geb('optimism-goerli', provider);

    // Get a function from the GEB object
    const tx = geb.deployProxy(wallet)

    // Log our data
    console.log(tx);

    // Save a file of our data
    // fs.writeFileSync('./logs/geb.auctions.getCollateralAuctions.json', JSON.stringify(data, null, 4)); // The third argument '4' is for pretty-printing the JSON data with an indentation of 4 spaces
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});