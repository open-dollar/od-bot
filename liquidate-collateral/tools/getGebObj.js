import { ethers } from 'ethers';
import { Geb, utils } from '@hai-on-op/sdk';
import fs from 'fs';
import { config } from 'dotenv';
config();

// Creates json file (~11MB) with all keys
function getKeys(obj, parentKey = '') {
    let structure = {};
    for (let key in obj) {
        // If the current key corresponds to an object, recurse on it
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            structure[key] = getKeys(obj[key], key);
        } else {
            structure[key] = typeof obj[key]; // store the type of the key value
        }
    }
    return structure;
}

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

    // Get all keys from the GEB object
    const structure = getKeys(geb);

    // Save the structure to a JSON file
    fs.writeFileSync('./logs/geb.structure.json', JSON.stringify(structure, null, 4)); // pretty-printed with 4 spaces indentation

    console.log("JSON report saved to './logs/geb.structure.json'");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
