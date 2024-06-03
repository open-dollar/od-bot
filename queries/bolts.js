const getUserBolts = async (address) => {
    const lowercaseAddress = address.toLowerCase()
    const url = `https://bot.opendollar.com/api/bolts?address=${lowercaseAddress}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const data = await response.json()

        if (response.ok && data.success) {
            const user = data.data.fuul.user
            const bolts = user && user.points ? user.points : 0
            return bolts
        } else {
            return 0
        }
    } catch (error) {
        console.error('Error fetching bolts:', error)
        return 0
    }
}

// Enter the user's address below
getUserBolts('USER_ADDRESS_HERE')
    .then(bolts => {
        console.log(`${bolts}`)
    })
    .catch(error => {
        console.error(error)
    })
