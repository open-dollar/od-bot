import fetch from "node-fetch";
import { setCorsHeaders } from "../../lib/cors";
import {headers} from "next/headers";

export const revalidate = 0;

export default async function handler(request, response) {
  setCorsHeaders(request, response);

  try {
    // const { country } = geolocation(request);
    const headerList = headers();
    console.error(headerList, 'headerList');
    console.error(headerList.get('X-Vercel-IP-Country'), 'headerList.get(\'X-Vercel-IP-Country\')');

    const country = headerList.get('X-Vercel-IP-Country');
    const bannedCountryCodes = ['US', 'IR', 'KP', 'CO'];

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