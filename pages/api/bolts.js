import { getUserBolts } from "../../lib/bolts/bolts";
import { setCorsHeaders } from "../../lib/cors";

export default async function handler(request, response) {
    setCorsHeaders(request, response);

    try {
        const { address } = request.query;

        const data = await getUserBolts(address);
        response.status(200).json({ success: true, data });
    } catch (e) {
        console.error(e);
        response.status(500).json({ success: false, error: e.message });
    }
}