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

// 3. Whitelist Logic (Copied from services/places.ts)
const allowedTypes = new Set([
    'cafe',
    'restaurant',
    'bar',
    'bakery',
    'park',
    'tourist_attraction',
    'museum',
    'art_gallery',
    'night_club'
]);

// 4. Fetch Function
const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${LAT},${LNG}&radius=${RADIUS}&key=${API_KEY}`;

console.log(`\n🔍 Fetching Nearby Places...`);
console.log(`📍 Location: ${LAT}, ${LNG}`);
console.log(`📏 Radius: ${RADIUS}m`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
                console.error("API Error:", json);
                return;
            }

            const results = json.results || [];
            console.log(`\n📦 Raw Results Found: ${results.length}`);

            const keywords = ['club', 'bar', 'pub', 'menza', 'canteen', 'pivnice', 'restaurace', 'coffee', 'cafe'];

            console.log(`\n--- 🛑 DISCARDED (Not in Whitelist) ---`);
            const discarded = results.filter(place => {
                const typeMatch = place.types.some(t => allowedTypes.has(t));
                const nameMatch = keywords.some(k => place.name.toLowerCase().includes(k));

                const keep = typeMatch;

                if (!keep) {
                    if (nameMatch) {
                        console.log(`⚠️ RECOVERABLE [${place.name}] Types: ${place.types.join(', ')} (Matched Keyword)`);
                    } else {
                        console.log(`❌ [${place.name}] Types: ${place.types.join(', ')}`);
                    }
                }
                return !keep;
            });

            console.log(`\n--- ✅ KEPT (In Whitelist) ---`);
            const kept = results.filter(place => {
                const keep = place.types.some(t => allowedTypes.has(t));
                if (keep) {
                    console.log(`✅ [${place.name}] Types: ${place.types.join(', ')}`);
                }
                return keep;
            });

            console.log(`\n📊 Summary:`);
            console.log(`   Total Raw: ${results.length}`);
            console.log(`   Discarded: ${discarded.length}`);
            console.log(`   Kept:      ${kept.length}`);

        } catch (e) {
            console.error("Parse Error:", e);
        }
    });

}).on('error', (e) => {
    console.error("Network Error:", e);
});
