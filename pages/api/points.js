import { updateGalxePointsForAllUsers } from "../../lib/galxe";
import { updateZealyPointsForAllUsers } from "../../lib/zealy";

export default async function handler(request, response) {
    try {
        const galxeData = await updateGalxePointsForAllUsers()

        const zealyData = await updateZealyPointsForAllUsers()

        response.status(200).json({ success: true, zealyData, galxeData });
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
