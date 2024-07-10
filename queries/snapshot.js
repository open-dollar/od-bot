import dotenv from 'dotenv'
const result = dotenv.config()

import fs from 'fs';

import { fetchFuulPagination, getLeaderboard } from "../lib/bolts/fuul.js"
import { giveBolts } from "../lib/bolts/bolts.js"

const COLLATERAL_DEPOSIT = 'COLLATERAL_DEPOSIT'
const DEBT_BORROW = 'DEBT_BORROW'
const ODG_ETH_LP = 'ODG_ETH_LP'
const OD_ETH_LP = 'OD_ETH_LP'

const takeSnapshot = async (address) => {
    const allUsers = await getLeaderboard()
    console.log('allUsers', allUsers.users.length)
    let data = []
    for (const user of allUsers.users) {
        const url = `https://api.fuul.xyz/api/v1/payouts?type=point&user_address=${user.address}`
        const conversions = await fetchFuulPagination(url)

        const boltsEarned = {}

        let combinedBorrowBolts = 0
        let combinedDepositBolts = 0
        conversions.forEach((conversion) => {
            if ([1, 2].includes(conversion.conversion_id))
                combinedBorrowBolts += parseInt(conversion.total_amount)
            else if ([3, 4].includes(conversion.conversion_id))
                combinedDepositBolts += parseInt(conversion.total_amount)
            else if (conversion.conversion_id === 7)
                boltsEarned[OD_ETH_LP] = parseInt(conversion.total_amount)
            else if (conversion.conversion_id === 8)
                boltsEarned[ODG_ETH_LP] = parseInt(conversion.total_amount)
        })
        boltsEarned[DEBT_BORROW] = combinedBorrowBolts
        boltsEarned[COLLATERAL_DEPOSIT] = combinedDepositBolts
        data.push({
            ...user,
            boltsEarned
        })
    }
    fs.writeFile('data.json', JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Data successfully written to file');
        }
    });
}

// takeSnapshot();

const uploadSnapshot = async () => {
    const data = fs.readFileSync('data.json', 'utf8');
    const parsedData = JSON.parse(data);

    const depositUsers = parsedData.reduce((acc, user) => (user.boltsEarned[COLLATERAL_DEPOSIT] > 0 ?
        [...acc, { bolts: user.boltsEarned[COLLATERAL_DEPOSIT], address: user.address }]
        : acc
    ), [])
    const borrowUsers = parsedData.reduce((acc, user) => (user.boltsEarned[DEBT_BORROW] > 0 ?
        [...acc, { bolts: user.boltsEarned[DEBT_BORROW], address: user.address }]
        : acc
    ), [])
    const odEthLpUsers = parsedData.reduce((acc, user) => (user.boltsEarned[OD_ETH_LP] > 0 ?
        [...acc, { bolts: user.boltsEarned[OD_ETH_LP], address: user.address }]
        : acc
    ), [])
    const odgEthLpUsers = parsedData.reduce((acc, user) => (user.boltsEarned[ODG_ETH_LP] > 0 ?
        [...acc, { bolts: user.boltsEarned[ODG_ETH_LP], address: user.address }]
        : acc
    ), [])

    console.log('depositUsers', depositUsers.length)
    await giveBolts(depositUsers, COLLATERAL_DEPOSIT)

    console.log('borrowUsers', borrowUsers.length)
    await giveBolts(borrowUsers, DEBT_BORROW)

    console.log('odEthLpUsers', odEthLpUsers.length)
    await giveBolts(odEthLpUsers, OD_ETH_LP)

    console.log('odgEthLpUsers', odgEthLpUsers.length)
    await giveBolts(odgEthLpUsers, ODG_ETH_LP)
}


uploadSnapshot();

const removeNonTurtleClubMembers = async () => {
    const prismaUsers = await prisma.user.findMany({
        select: {
            id: true,
            bolts: true
        },
        where: {
            bolts: {
                gt: 0
            }
        }
    })

    console.log("Users with bolts: ", prismaUsers.length)

    for (const user of prismaUsers) {
        console.log("User: ", user.id)

        await prisma.userCampaign.deleteMany({
            where: { userId: user.id },
        })
        await prisma.userMultiplier.deleteMany({
            where: { userId: user.id },
        })
        await prisma.campaignEvent.deleteMany({
            where: { userId: user.id },
        })
        await prisma.user.delete({
            where: { id: user.id },
        })
    }
}

// removeNonTurtleClubMembers()