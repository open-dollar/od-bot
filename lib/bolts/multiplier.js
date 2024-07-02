import prisma from "../prisma";
import { getQuery } from '../utils.js';

import { fetchTokenBalance } from "../web3/common"
import { getVaults } from "../vaults"
import { updateMultipliers } from "./bolts"
import { fetchTurtleClubUsers } from "./turtleClub"

export const MULTIPLIER_BASE = 100
export const ADDED_MULTIPLIER_EVENT_ACTIVITY = "ADDED"
export const REMOVED_MULTIPLIER_EVENT_ACTIVITY = "REMOVED"

const TURTLE_CLUB_MULTIPLIER_TYPE = 'TURTLE_CLUB'
const TURTLE_CLUB_MULTIPLIER_AMOUNT = 10

const GENESIS_NFT_MULTIPLIER_TYPE = 'GENESIS_NFT'
const GENESIS_NFT_MULTIPLIER_AMOUNT = 7

const GENESIS_NFV_MULTIPLIER_TYPE = 'GENESIS_NFV'
const GENESIS_NFV_MULTIPLIER_AMOUNT = 10

const OG_NFT_MULTIPLIER_TYPE = 'OG_NFT'
const OG_NFT_MULTIPLIER_AMOUNT = 3

const getGenesisNfvUsers = async () => {
    const data = await getVaults("ARBITRUM");
    let users = []
    data.map(vault => {
        if (vault.genesis) users.push(vault.owner.toLowerCase())
    })
    return users
}

const getNftOwnersFromAlchemy = async (contractAddress, networkSubdomain) => {
    const url = `https://${networkSubdomain}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getOwnersForContract?contractAddress=${contractAddress}`

    const data = await getQuery(url)
    return data.owners
}

const getGenesisNftUsers = async () => {
    const tokenAddress = "0x3D6d1f3cEeb33F8cF3906bb716360ba25037beC8"
    const networkSubdomain = "arb-mainnet"
    return await getNftOwnersFromAlchemy(tokenAddress, networkSubdomain)
}

const getOgNftUsers = async () => {
    const tokenAddress = "0x346324e797c8Fa534B10fC9127CCFD9cB9E9AAB7"
    const networkSubdomain = "polygon-mainnet"
    return await getNftOwnersFromAlchemy(tokenAddress, networkSubdomain)
}

const createMultiplierUpdates = async (usersWithMultiplier, multiplierEventType, multiplierAmount) => {
    let usersToUpdate = []
    usersToUpdate.push(...usersWithMultiplier.map(userAddress => ({
        multiplierEventType,
        address: userAddress,
        activity: ADDED_MULTIPLIER_EVENT_ACTIVITY,
        multiplier: multiplierAmount
    })))

    const prismaUsersWithTurtleClubMultiplier = await prisma.user.findMany({
        where: {
            multipliers: {
                some: { type: multiplierEventType }
            }
        }
    })
    for (const user of prismaUsersWithTurtleClubMultiplier) {
        if (!usersWithMultiplier.includes(user.id))
            usersToUpdate.push({
                multiplierEventType,
                address: user.id,
                activity: REMOVED_MULTIPLIER_EVENT_ACTIVITY
            })
    }
    return usersToUpdate
}

const checkGenesisNft = async () => {
    const genesisNftUsers = await getGenesisNftUsers()
    const usersToUpdate = await createMultiplierUpdates(genesisNftUsers,
        GENESIS_NFT_MULTIPLIER_TYPE,
        GENESIS_NFT_MULTIPLIER_AMOUNT)
    await updateMultipliers(usersToUpdate)
}

const checkGenesisNfv = async () => {
    const genesisNfvUsers = await getGenesisNfvUsers()
    const usersToUpdate = await createMultiplierUpdates(genesisNfvUsers,
        GENESIS_NFV_MULTIPLIER_TYPE,
        GENESIS_NFV_MULTIPLIER_AMOUNT)
    await updateMultipliers(usersToUpdate)
}

const checkOgNft = async () => {
    const ogNftUsers = await getOgNftUsers()
    const usersToUpdate = await createMultiplierUpdates(ogNftUsers,
        OG_NFT_MULTIPLIER_TYPE,
        OG_NFT_MULTIPLIER_AMOUNT)
    await updateMultipliers(usersToUpdate)
}
const checkTurtleClub = async () => {
    const turtleClubUsers = await fetchTurtleClubUsers()
    const usersToUpdate = await createMultiplierUpdates(turtleClubUsers,
        TURTLE_CLUB_MULTIPLIER_TYPE,
        TURTLE_CLUB_MULTIPLIER_AMOUNT)
    await updateMultipliers(usersToUpdate)
}


export const checkMultipliers = async () => {
    // await checkGenesisNft()
    // await checkGenesisNfv()
    // await checkOgNft()
    await checkTurtleClub()
}