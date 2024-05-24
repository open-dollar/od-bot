import { Web3Providers } from "./provider";
import { Contract } from "@ethersproject/contracts";

const ERC20_ABI = [
    'function totalSupply() view returns (uint256)',
];

export const getTotalSupply = async (network, tokenAddress) => {
    try {
        const provider = Web3Providers[network];
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
        return await tokenContract.totalSupply();
    } catch (e) {
        console.error('Failed to get total supply:', e);
        throw e;
    }
};