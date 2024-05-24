import { Web3Providers } from "./web3/provider";
import { getUserVaults } from "./userVaults";
import prisma from "./prisma";
import { Contract } from "@ethersproject/contracts";
import { getUserFuulData, getLeaderboard } from "./fuul";

export const getUserBolts = async (address) => {
    let OgNFV = false;
    let GenesisNFT = false;
    let OgNFT = false;
    let galxe = false;
    let zealy = false;

    if (address) {
        OgNFV = await hasOgNFV(address);
        GenesisNFT = await hasGenesisNFT(address);
        OgNFT = await hasOgNFT(address);

        ({ galxe, zealy } = await getSocialPoints(address))
    }

    const fuulData = await getUserFuulData(address);
    const leaderboard = await getLeaderboard()

    return {
        OgNFT,
        OgNFV,
        GenesisNFT,
        galxe,
        zealy,
        fuulData,
        leaderboard
    }
}

const hasOgNFV = async (address) => {
    try {
        const data = await getUserVaults(address, "ARBITRUM");
        let hasOgNFV = false;
        data.vaults.map(vault => {
            if (vault.genesis) hasOgNFV = true;
        })
        return hasOgNFV
    } catch (error) {
        console.log(error)
        return null
    }
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
    try {
        const tokenAddress = "0x3D6d1f3cEeb33F8cF3906bb716360ba25037beC8"
        const balance = await fetchTokenBalance("ARBITRUM", tokenAddress, address);

        if (balance > 0) return true;
        return false
    } catch (error) {
        console.log(error)
        return null
    }
}

const hasOgNFT = async (address) => {
    try {
        const tokenAddress = "0x346324e797c8Fa534B10fC9127CCFD9cB9E9AAB7"
        const balance = await fetchTokenBalance("POLYGON", tokenAddress, address);

        if (balance > 0) return true;
        return false
    } catch (error) {
        console.log(error)
        return null
    }
}

const getSocialPoints = async (address) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: address.toLowerCase() }
        })

        return {
            galxe: user?.galxePoints > 0 ? true : false,
            zealy: !user?.zealyPoints > 0 ? true : false
        }
    } catch (error) {
        console.log(error)
        return { galxe: null, zealy: null }
    }
}