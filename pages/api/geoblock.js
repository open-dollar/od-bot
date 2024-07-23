import fetch from 'node-fetch';
import { setCorsHeaders } from '../../lib/cors';

export default async function handler(request, response) {
    setCorsHeaders(request, response);
    const { ip } = request.query;

    if (!ip) {
        return response.status(400).json({ success: false, error: 'IP address is required' });
    }

    try {
        const geoResponse = await fetch(`https://api.country.is/${ip}`);
        const geoData = await geoResponse.json();

        if (geoData && geoData.country) {
            const bannedCountryCodes = ['US', 'IR', 'KP', 'CO'];
            const userCountryCode = geoData.country;

            if (bannedCountryCodes.includes(userCountryCode)) {
                return response.status(200).json({ success: false, message: 'Access blocked due to geolocation' });
            }
        }

        return response.status(200).json({ success: true, message: 'Access allowed' });
    } catch (error) {
        console.error('Error checking geoblocking:', error);
        return response.status(500).json({ success: false, error: error.message });
    }
}