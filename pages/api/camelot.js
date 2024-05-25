import { updateCamelotPointsForAllUsers } from "../../lib/camelot";

export default async function handler(request, response) {
    try {
        const data = await updateCamelotPointsForAllUsers()

        response.status(200).json({ success: true, data });
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
