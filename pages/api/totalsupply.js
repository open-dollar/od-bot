import { getTotalSupply } from '../../lib/web3/totalsupply';
import { formatUnits } from "@ethersproject/units";
import { initGeb } from "../../lib/web3/geb";

const ARBITRUM = "ARBITRUM";

let geb;
try {
    geb = initGeb(ARBITRUM);
} catch (e) {
    console.error('Failed to initialize GEB:', e);
    throw e;
}

const tokenSymbolToAddress = (symbol) => {
    const token = geb.tokenList[symbol.toUpperCase()];
    if (!token) {
        throw new Error(`Token symbol not found: ${symbol}`);
    }
    return token.address;
};

export default async function handler(request, response) {
    try {
        let network = ARBITRUM;

        const { token } = request.query;

        if (!token) {
            return response.status(400).json({ success: false, error: "Token parameter is required" });
        }

        if (!geb) {
            return response.status(500).json({ success: false, error: "Failed to initialize GEB" });
        }

        const tokenAddress = tokenSymbolToAddress(token);
        const totalSupply = await getTotalSupply(network, tokenAddress);

        const formattedSupply = formatUnits(totalSupply.toString(), 18);

        response.status(200).json({ success: true, totalSupply: formattedSupply });
    } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
    }
}