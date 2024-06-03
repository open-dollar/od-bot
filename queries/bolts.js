require('dotenv').config()

const FUUL_API_KEY = process.env.FUUL_API_KEY

const getUserBolts = async (address) => {
    const lowercaseAddress = address.toLowerCase();
    const url = `https://api.fuul.xyz/api/v1/payouts?type=point&user_address=${lowercaseAddress}`;
    const HEADERS = {
        'Authorization': `Bearer ${FUUL_API_KEY}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: HEADERS
        });
        const data = await response.json();
        console.log(data, 'data')

        if (response.ok && data.results) {
            return data.results.reduce((total, item) => total + Number(item.total_amount), 0);
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error fetching bolts:', error);
        return 0;
    }
};

getUserBolts('USER_ADDRESS_HERE')
    .then(bolts => {
        console.log(`${bolts}`);
    })
    .catch(error => {
        console.error(error);
    });