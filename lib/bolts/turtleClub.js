import { getQuery } from '../utils.js';

export const fetchTurtleClubUsers = async () => {
    const data = await getQuery("https://points.turtle.club/protocol/all_users")
    return data.map(u => u.address.toLowerCase())
}
