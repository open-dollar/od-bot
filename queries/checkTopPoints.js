const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/52770/open-dollar---mainnet/v1.8.0-rc.1';

const postQuery = (query, variables) => {
    return fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables
        }),
    })
        .then(r => r.json())
        .then(data => {
            return data;
        })
}


console.log('Checking top points...');
const main = async () => {
    const pointsUsers = await prisma.user.findMany({
        select: {
            id: true,
            zealyPoints: true,
            galxePoints: true
        },
        orderBy: {
            zealyPoints: 'desc',
            // galxePoints: 'desc'
        },
        take: 10000
    });

    const protocolUsers = await postQuery(`
        query AllUsers {
            vaults(first:1000) {
                id
                owner
                collateral
                debt
                collateralType
            }
        }`
    ).then(data => {
        let owners = []
        data.data.vaults.map(vault => {
            if (!owners.includes(vault.owner))
                owners.push(vault.owner)
        })
        return owners
    })

    // Compare pointsUsers with protocolUsers
    pointsAndProtocolUsers = pointsUsers.filter(user => protocolUsers.includes(user.id))
    console.log("protocol users: ", protocolUsers.length)
    console.log("points users: ", pointsUsers.length)
    console.log("points and protocol users: ", pointsAndProtocolUsers.length)
}
main()