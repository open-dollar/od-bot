import { updateGalxePointsForAllUsers } from "../../lib/galxe";

export default async function handler(request, response) {
    try {
        // TODO: add access control

        await updateGalxePointsForAllUsers()

        response.status(200).json({ success: true });
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
