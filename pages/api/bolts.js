import { getUserBolts } from "../../lib/bolts";

export default async function handler(request, response) {
    try {
        const { address } = request.query;

        if (!address)
            return response.status(400).json({ success: false, error: "Address parameter is required" });

        const data = await getUserBolts(address);

        response.status(200).json({ success: true, data });
    } catch (e) {
        console.error(e);
        response.status(500).json({ success: false, error: e.message });
    }
}