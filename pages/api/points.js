import { updateGalxePointsForAllUsers } from "../../lib/galxe";
import { updateZealyPointsForAllUsers } from "../../lib/zealy";
import { updateCamelotPointsForAllUsers } from "../../lib/camelot"

export default async function handler(request, response) {
    try {
        // const galxeData = await updateGalxePointsForAllUsers()

        // const zealyData = await updateZealyPointsForAllUsers()
        const zealyData = {}
        const galxeData = {}
        // TODO: move to another endpoint for daily updates
        const camelotData = await updateCamelotPointsForAllUsers()

        response.status(200).json({ success: true, zealyData, galxeData, camelotData });
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
