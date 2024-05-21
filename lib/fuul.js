// https://docs.fuul.xyz/technical-guide-for-projects/sending-trigger-events-through-the-fuul-api

const FUUL_API_KEY = process.env.FUUL_API_KEY

export const giveFuulPoints = async (users) => {
    url = "https://api.fuul.xyz/api/v1/events"
    // url = "https://api.fuul.xyz/api/v1/events/batch"

    payload = {
        "args": {
            "value": {
                "amount": "1000000",
                "currency": "USDC"
            },
            "revenue": {
                "amount": "100000",
                "currency": "USDC"
            }
        },
        "name": "trigger-event-name",
        "user_address": "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
        "dedup_id": "80652e61-986f-4d01-b4d5-1d3697fe36f4",
        "timestamp": "1710875677000"
    }

    headers = {
        "content-type": "application/json",
        "authorization": `Bearer ${FUUL_API_KEY}`
    }
}
