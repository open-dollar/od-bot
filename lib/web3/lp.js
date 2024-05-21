import { Web3Providers } from "./provider";
import { BigNumber}  from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { initGeb } from "./geb";

// Only Arbitrum for now because there aren't pools to query for other networks
const geb = initGeb("ARBITRUM");

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
];

const OD_ADDRESS = geb.tokenList['OD'].address
const ODG_ADDRESS = geb.tokenList['ODG'].address

const POOLS = {
    od: [
        { address: '0x824959a55907d5350e73e151Ff48DabC5A37a657', token: OD_ADDRESS }, // OD-ETH
        { address: '0x0d867ef7cc5132881ff0216be9498a0993caaf68', token: OD_ADDRESS }  // OD-crvUSD
    ],
    odg: [
        { address: '0xF935263c9950EB2881FF58Bd6a76c3D2564A78D5', token: ODG_ADDRESS }  // ODG-ETH
    ],
};

const fetchTokenBalance = async (provider, poolAddress, tokenAddress) => {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
    return await tokenContract.balanceOf(poolAddress);
};

export const getTotalLpBalance = async (network, tokenSymbol) => {
    try {
        const provider = Web3Providers[network];
        const pools = POOLS[tokenSymbol.toLowerCase()];

        if (!pools) {
            throw new Error(`No pools defined for token: ${tokenSymbol}`);
        }

        let totalBalance = BigNumber.from(0);

        for (const pool of pools) {
            const balance = await fetchTokenBalance(provider, pool.address, pool.token);
            totalBalance = totalBalance.add(balance);
        }

        return totalBalance;
    } catch (e) {
        console.error('Failed to get total LP balance:', e);
        throw e;
    }
};