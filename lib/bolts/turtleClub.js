import { getQuery } from '../utils.js';

export const fetchTurtleClubUsers = async () => {
    const { data } = await getQuery("https://points.turtle.club/protocol/all_users")
    // const data = [{ "address": "0x8a05d886aaa096652506f0207df13d16ba6f032a", "start": 1709821736034 }, { "address": "0x1da6307b0caf852fb3b76fb72469fc24862303f1", "start": 1714487241108 }, { "address": "0x1fe82bea7aa95e9595777a10712a4a60bcf9c6be", "start": 1712499300752 }, { "address": "0x9329b8759e6f4cd871cf0b97f50a6d86c2280b20", "start": 1712250027585 }, { "address": "0x37f51d9759f2876073d11b0fba3b498ade8389b0", "start": 1711604000470 }, { "address": "0x2cfdde4a4ddd2b4cf28a8c286ca887fe12a003bf", "start": 1713571087819 }, { "address": "0x3ccc596a2be298ff9e94bc583bc1de6429cd0f0a", "start": 1710151721479 }, { "address": "0xb187a6d7bfadbca875164eb2be8a862b320dfc98", "start": 1710155132832 }, { "address": "0x9f14e226f2b7b89ad1112ab3e1cbbceedab15b4a", "start": 1710177941370 }, { "address": "0x7c4f342384d9328162048c4da9508d208f63abf8", "start": 1710880435891 }]
    return data.map(u => u.address.toLowerCase())
}
