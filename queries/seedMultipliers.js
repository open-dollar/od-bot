const dotenv = require('dotenv')
const { PrismaClient } = require("@prisma/client");
const fs = require('fs');

dotenv.config()
const prisma = new PrismaClient();

const getQuery = (url, headers) => {
    return fetch(url, {
        method: 'GET',
        headers,
    })
        .then(r => {
            if (r.status !== 200) {
                console.log(r)
                throw new Error(r.statusText)
            }
            return r.json()
        })
        .then(data => {
            return data;
        })
}

const fetchTurtleClub = async () => {
    const data = await getQuery("https://points.turtle.club/protocol/all_users")
    const users = data.map(u => u.address.toLowerCase())

    fs.writeFile('turtleclub.json', JSON.stringify(users, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Data successfully written to file');
        }
    });
}
// fetchTurtleClub()

const seedMultipliers = async () => {
    const turtleClubMembers = JSON.parse(fs.readFileSync('turtleclub.json', 'utf8'))

    const TURTLE_CLUB_MULTIPLIER_TYPE = 'TURTLE_CLUB'
    const TURTLE_CLUB_MULTIPLIER_AMOUNT = 10
    const MULTIPLIER_BASE = 100

    const prismaUsers = await prisma.user.findMany({
        where: {
            multipliers: {
                some: { type: TURTLE_CLUB_MULTIPLIER_TYPE }
            }
        }
    })

    let usersToCreate = []
    for (let index = 0; index < turtleClubMembers.length; index++) {
        const user = turtleClubMembers[index];
        const prismaUser = prismaUsers.find(u => u.id === user)
        if (!prismaUser) {
            usersToCreate.push({
                id: user,
                multiplier: MULTIPLIER_BASE + TURTLE_CLUB_MULTIPLIER_AMOUNT,
                multipliers: {
                    create: {
                        amount: TURTLE_CLUB_MULTIPLIER_AMOUNT,
                        type: TURTLE_CLUB_MULTIPLIER_TYPE,
                    }
                }
            })
        }
    }
    console.log("Users to create: ", usersToCreate.length)

    function chunkArray(array, chunkSize = 100) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    const chunks = chunkArray(usersToCreate, 100)

    for (let index = 0; index < chunks.length; index++) {
        console.log("Progress: ", index, "/", chunks.length)
        await Promise.all(chunks[index].map(async user => await prisma.user.create({ data: user })))
    }

}
seedMultipliers()