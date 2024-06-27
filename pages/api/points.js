import { executePointsOperation, POINTS_OPERATION } from "../../lib/bolts/bolts"

export default async function handler(request, response) {
    try {
        let type
        if (request.query.type) type = request.query.type;
        if (!type) return response.status(400).json({ error: 'Missing type' });
        if (POINTS_OPERATION.indexOf(type) === -1) return response.status(400).json({ error: `Invalid type. Available types are ${POINTS_OPERATION.entries}` })

        const data = await executePointsOperation(type)

        response.status(200).json({ success: true, data });
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
