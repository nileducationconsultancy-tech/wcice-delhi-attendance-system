const axios = require('axios');

const reverseGeocode = async (latitude, longitude) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
        console.warn('GEOAPIFY_API_KEY is not configured. Reverse geocoding skipped.');
        return null;
    }

    try {
        const response = await axios.get('https://api.geoapify.com/v1/geocode/reverse', {
            params: {
                lat: latitude,
                lon: longitude,
                apiKey: apiKey
            }
        });

        if (response.data && response.data.features && response.data.features.length > 0) {
            const properties = response.data.features[0].properties;
            return properties.formatted; // This contains the formatted address
        }
        
        return null;
    } catch (error) {
        console.error('Geoapify Reverse Geocoding Error:', error.response?.data || error.message);
        return null; // Return null so attendance check-in/out doesn't fail completely if Geoapify is down
    }
};

module.exports = { reverseGeocode };
