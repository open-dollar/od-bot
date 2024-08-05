import fetch from "node-fetch";
import { setCorsHeaders } from "../../lib/cors";

export default async function handler(request, response) {
  setCorsHeaders(request, response);

  try {
    const country = request.headers['x-vercel-ip-country'];
    const bannedCountryCodes = ['US', 'IR', 'KP'];

    if (country && bannedCountryCodes.includes(country)) {
      return response.status(200).json({ success: false, message: 'geoblocked' });
    }

    const result = await fetch(
        `https://public.chainalysis.com/api/v1/address/${request.query.address}`,
        {
          headers: {
            "X-API-Key": process.env.CHAINALYSIS_KEY,
            Accept: "application/json",
          },
        }
    );

    const data = await result.json();

    if (!result.ok) {
      throw new Error(data.message || 'Failed to fetch data');
    }

    return response.send(data);
  } catch (e) {
    console.log(e);
    return response.status(500).json({ success: false, error: e.message });
  }
}
