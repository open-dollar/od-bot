import { Web3Providers } from "./web3/provider";
import { getUserVaults } from "./userVaults";
import prisma from "./prisma";
import { Contract } from "@ethersproject/contracts";


export const getUserBolts = async (address) => {
    const OgNFV = await hasOgNFV(address);

    const GenesisNFT = await hasGenesisNFT(address);
    const OgNFT = await hasOgNFT(address);

    const { galxe, zealy } = await getSocialPoints(address);

    return {
        OgNFT,
        OgNFV,
        GenesisNFT,
        galxe,
        zealy
    }
}

const hasOgNFV = async (address) => {
    const data = await getUserVaults(address, "ARBITRUM");
    let hasOgNFV = false;
    data.vaults.map(vault => {
        if (vault.genesis) hasOgNFV = true;
    })
    return hasOgNFV
}

const fetchTokenBalance = async (network, tokenAddress, userAddress) => {
    const provider = Web3Providers[network];

    const ERC721_ABI = [
        'function balanceOf(address owner) view returns (uint256)',
    ];
    const tokenContract = new Contract(tokenAddress, ERC721_ABI, provider);
    return await tokenContract.balanceOf(userAddress);
};

const hasGenesisNFT = async (address) => {
    const tokenAddress = "0x3D6d1f3cEeb33F8cF3906bb716360ba25037beC8"
    const balance = await fetchTokenBalance("ARBITRUM", tokenAddress, address);

    if (balance > 0) return true;
    return false
}

const hasOgNFT = async (address) => {
    const tokenAddress = "0x346324e797c8Fa534B10fC9127CCFD9cB9E9AAB7"
    const balance = await fetchTokenBalance("POLYGON", tokenAddress, address);

    if (balance > 0) return true;
    return false
}

const getSocialPoints = async (address) => {
    const user = await prisma.user.findUnique({
        where: { id: address.toLowerCase() }
    })

    return {
        galxe: !!user?.galxePoints || false,
        zealy: !!user?.zealyPoints || false
    }
}