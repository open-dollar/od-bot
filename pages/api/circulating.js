import { getTotalSupply } from '../../lib/web3/totalsupply';
import { formatUnits } from "@ethersproject/units";
import { initGeb } from "../../lib/web3/geb";
import { BigNumber } from "@ethersproject/bignumber";

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

const getReservedTokenAmount = async (symbol) => {
    switch (symbol.toUpperCase()) {
        case 'OD':
            return BigNumber.from('0')
        case 'ODG':
            // Hardcoded 9,881,565 in wei. Includes airdrop, initial liquidity, and rewards
            return BigNumber.from('9881565000000000000000000')
        default:
            throw new Error(`Unknown token symbol: ${symbol}`);
    }
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

        const reservedValue = await getReservedTokenAmount(token, network);

        const circulatingSupply = totalSupply.sub(reservedValue);

        const formattedCirculatingSupply = formatUnits(circulatingSupply.toString(), 18);

        response.status(200).json(formattedCirculatingSupply);
    } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
    }
}