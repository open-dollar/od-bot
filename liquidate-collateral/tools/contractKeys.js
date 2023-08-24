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

    const addresses = await geb.addresses;

    let details = {};

    for (let key of Object.keys(addresses)) {
        const addressValue = addresses[key];
        
        // Assuming geb.address[key] is an asynchronous function that retrieves details for a given address
        const addressDetails = await geb.addresses[key];
        
        details[key] = {
            address: addressValue
        };
    }

    console.log(details);

    // or Save a file of our data
    fs.writeFileSync('./logs/geb.address.v1.2.0-rc.1.json', JSON.stringify(details, null, 4)); // The third argument '4' is for pretty-printing the JSON data with an indentation of 4 spaces
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});