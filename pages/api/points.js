import { updateGalxePointsForAllUsers } from "../../lib/galxe";
import { updateZealyPointsForAllUsers } from "../../lib/zealy";

export default async function handler(request, response) {
    try {
        // TODO: Multiple campaigns not available. Points will need to be isolated by campaignId in the db
        const campaignIds = ["GCHpqttjuU"]

        let galxeData = {}
        for (const campaignId of campaignIds) {
            galxeData[campaignId] = await updateGalxePointsForAllUsers(campaignId)
        }

        const zealyData = await updateZealyPointsForAllUsers()

        response.status(200).json({ success: true, zealyData, galxeData });
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
