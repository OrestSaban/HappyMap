const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Load API Key
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=(.+)/);
if (!match) {
    console.error("Could not find API KEY in .env");
    process.exit(1);
}
const API_KEY = match[1].trim();

// 2. Configuration
const LAT = 50.07998135603493;
const LNG = 14.394073243204078;
const RADIUS = 500;

// 3. New API Payload
const postData = JSON.stringify({
    includedTypes: ['restaurant', 'cafe', 'bar', 'park', 'tourist_attraction'],
    maxResultCount: 20,
    locationRestriction: {
        circle: {
            center: {
                latitude: LAT,
                longitude: LNG
            },
            radius: RADIUS
        }
    }
});

const options = {
    hostname: 'places.googleapis.com',
    path: '/v1/places:searchNearby',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.id,places.types,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus'
    }
};

console.log(`\n🔍 Testing New Places API (v1)...`);
console.log(`📍 Location: ${LAT}, ${LNG}`);
console.log(`📏 Radius: ${RADIUS}m`);

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("\n❌ API Error:", json.error);
            } else {
                console.log(`\n✅ Success! Found ${json.places ? json.places.length : 0} places.`);
                if (json.places && json.places.length > 0) {
                    console.log("Sample Place:", json.places[0].displayName.text);
                    console.log("Types:", json.places[0].types);
                }
            }
        } catch (e) {
            console.error("Parse Error:", e);
        }
    });
});

req.on('error', (e) => {
    console.error("Network Error:", e);
});

req.write(postData);
req.end();
