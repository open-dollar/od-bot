import { valueInCamelot } from "../../lib/web3/camelot";

export default async function handler(request, response) {
    try {
        const userAddress = request.query.userAddress;
        const camelotPoolAddress = request.query.camelotPoolAddress;
        const nitroPoolAddress = request.query.nitroPoolAddress;
        if (!userAddress || !camelotPoolAddress || !nitroPoolAddress) {
            return response.status(400).json({ error: "Missing required parameters" });
        }
        const value = await valueInCamelot(userAddress, camelotPoolAddress, nitroPoolAddress)

        response.status(200).json(value);
    } catch (e) {
        console.log(e);
        return response.status(500).json({ error: e.message });
    }
}
