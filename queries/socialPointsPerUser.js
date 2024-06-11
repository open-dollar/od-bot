import dotenv from 'dotenv'
dotenv.config()

import { fetchGalxeUser } from "../lib/galxe.js"
import { fetchZealyUser } from "../lib/zealy.js"
import { fetchFuulPagination } from "../lib/fuul.js"

const socialPointsPerUser = async (address) => {
    console.log(`User: ${address}`)
    const galxeUser = await fetchGalxeUser(address)

    const zealyUser = await fetchZealyUser(address)
    let socialPointsEarned = 0
    const galxePoints = galxeUser?.points || 0
    const zealyPoints = zealyUser?.points || 0
    console.log(`Galxe Points: `, galxePoints)
    socialPointsEarned += galxePoints
    console.log(`Zealy Points: `, zealyPoints)
    socialPointsEarned += zealyPoints

    const url = `https://api.fuul.xyz/api/v1/payouts?type=point&user_address=${address}`
    const conversions = await fetchFuulPagination(url)

    const socialConversion = conversions.find(conversion => conversion.conversion_id === 6)
    console.log('Bolts earned from Zealy + Galxe: ', socialConversion.total_amount)

    const pointDelta = socialPointsEarned - Number(socialConversion.total_amount)
    console.log(`Points owed: `, pointDelta)
    console.log("\n\n")
}

const exampleUsers = []

for (const address of exampleUsers) {
    await socialPointsPerUser(address)
}