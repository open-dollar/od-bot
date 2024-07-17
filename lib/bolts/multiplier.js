import prisma from "../prisma";
import { getQuery } from '../utils.js';

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
    return users.reduce((acc, address) => acc.includes(address) ? acc : [...acc, address.toLowerCase()], [])
}

const getNftOwnersFromAlchemy = async (contractAddress, networkSubdomain) => {
    const url = `https://${networkSubdomain}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getOwnersForContract?contractAddress=${contractAddress}`

    const data = await getQuery(url)
    return data.owners.map(address => address.toLowerCase())
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

    const prismaUsers = await prisma.user.findMany({
        where: {
            multipliers: {
                some: { type: multiplierEventType }
            }
        }
    })
    for (const user of prismaUsers) {
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
    const type = GENESIS_NFT_MULTIPLIER_TYPE
    const usersToUpdate = await createMultiplierUpdates(genesisNftUsers,
        type,
        GENESIS_NFT_MULTIPLIER_AMOUNT)
    const { users } = await updateMultipliers(usersToUpdate)
    return { users, type }
}

const checkGenesisNfv = async () => {
    const genesisNfvUsers = await getGenesisNfvUsers()
    const type = GENESIS_NFV_MULTIPLIER_TYPE
    const usersToUpdate = await createMultiplierUpdates(genesisNfvUsers,
        type,
        GENESIS_NFV_MULTIPLIER_AMOUNT)
    const { users } = await updateMultipliers(usersToUpdate)
    return { users, type }
}

const checkOgNft = async () => {
    const ogNftUsers = await getOgNftUsers()
    const type = OG_NFT_MULTIPLIER_TYPE
    const usersToUpdate = await createMultiplierUpdates(ogNftUsers,
        type,
        OG_NFT_MULTIPLIER_AMOUNT)
    const { users } = await updateMultipliers(usersToUpdate)
    return { users, type }

}
const checkTurtleClub = async () => {
    const turtleClubUsers = await fetchTurtleClubUsers()
    const type = TURTLE_CLUB_MULTIPLIER_TYPE
    const usersToUpdate = await createMultiplierUpdates(turtleClubUsers,
        type,
        TURTLE_CLUB_MULTIPLIER_AMOUNT)
    const { users } = await updateMultipliers(usersToUpdate)
    return { users, type }

}


export const checkMultipliers = async () => {
    const response1 = await checkGenesisNft()
    const response2 = await checkGenesisNfv()
    const response3 = await checkOgNft()
    // const response4 = await checkTurtleClub()
    return {
        changes: [response1, response2, response3,]//response4]
    }
}