import { ethers } from 'ethers';
import { Geb, utils } from '@hai-on-op/sdk';
import fs from 'fs';
import { config } from 'dotenv';
config();

// Recursive function to get all keys
// Dumps a large file (~18MB) into ./logs/geb.keys.md
function getKeys(obj, parentKey = '') {
    let keys = [];
    for (let key in obj) {
        // Construct the full key path
        let fullKey = parentKey ? `${parentKey}.${key}` : key;
        
        keys.push(fullKey);
        
        // If the current key corresponds to an object, recurse on it
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getKeys(obj[key], fullKey));
        }
    }
    return keys;
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
    const allKeys = getKeys(geb);

    // Convert the keys to markdown format
    const markdownReport = allKeys.map(key => `- ${key}`).join('\n');

    // Save the report to a markdown file
    fs.writeFileSync('./logs/geb.keys.md', markdownReport);

    console.log("Markdown report saved to './logs/geb.keys.md'");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
