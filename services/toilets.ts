import { Place } from './places';

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Fetches nearby toilets from OpenStreetMap using the Overpass API.
 * If no toilets found within radius, expands to 5km and returns closest 10.
 */
export const fetchNearbyToilets = async (
    latitude: number,
    longitude: number,
    radius: number = 500,
    isExpanded: boolean = false
): Promise<Place[]> => {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';

    // Use larger radius for expanded search
    const searchRadius = isExpanded ? 5000 : radius;

    // Increase timeout to 25s to avoid frequent 504s
    const query = `
        [out:json][timeout:25];
        (
            node["amenity"="toilets"](around:${searchRadius},${latitude},${longitude});
            way["amenity"="toilets"](around:${searchRadius},${latitude},${longitude});
        );
        out body center;
    `;

    try {
        const response = await fetch(overpassUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
            // Gracefully handle timeouts or overloaded server
            if (response.status === 504 || response.status === 429 || response.status === 502) {
                console.warn(`Overpass API unavailable (Status ${response.status}). Returning empty list.`);
                // Return empty list so the app doesn't crash or show error state, just "0 toilets found"
                return [];
            }
            throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json();

        let toilets: Place[] = (data.elements || []).map((element: any) => {
            const lat = element.lat || element.center?.lat;
            const lng = element.lon || element.center?.lon;

            if (!lat || !lng) return null;

            const tags = element.tags || {};

            let name = tags.name || 'Public Toilet';
            const details: string[] = [];

            if (tags.fee === 'yes') details.push('Paid');
            if (tags.fee === 'no') details.push('Free');
            if (tags.wheelchair === 'yes') details.push('♿');
            if (tags.changing_table === 'yes') details.push('👶');
            if (tags.unisex === 'yes') details.push('Unisex');

            let vicinity = 'Public Toilet';
            if (tags['addr:street']) {
                vicinity = tags['addr:street'];
                if (tags['addr:housenumber']) {
                    vicinity = `${tags['addr:housenumber']} ${vicinity}`;
                }
            }

            if (details.length > 0) {
                name = `${name} (${details.join(', ')})`;
            }

            // Calculate distance from user
            const distance = calculateDistance(latitude, longitude, lat, lng);

            return {
                place_id: `osm_${element.type}_${element.id}`,
                name: name,
                vicinity: vicinity,
                geometry: {
                    location: {
                        lat: lat,
                        lng: lng,
                    },
                },
                types: ['toilet', 'restroom', 'amenity'],
                rating: undefined,
                user_ratings_total: undefined,
                opening_hours: tags.opening_hours ? {
                    open_now: true,
                    weekday_text: [tags.opening_hours],
                } : undefined,
                photos: undefined,
                summary: buildToiletSummary(tags),
                distance: distance,
            };
        }).filter(Boolean) as Place[];

        // Sort by distance
        toilets.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // If no results and this wasn't already an expanded search, expand and return closest 10
        if (toilets.length === 0 && !isExpanded) {
            console.log('No toilets in radius, expanding search to 5km...');
            // Add a small delay/jitter before retrying to avoid hammering the server
            await new Promise(r => setTimeout(r, 1000));
            return fetchNearbyToilets(latitude, longitude, radius, true);
        }

        // If expanded search, limit to 10 closest
        if (isExpanded) {
            toilets = toilets.slice(0, 10);
        }

        return toilets;

    } catch (error) {
        console.error('Error fetching toilets from OSM:', error);
        // Return empty array instead of crashing on network issues
        return [];
    }
};

/**
 * Builds a helpful summary string from OSM toilet tags
 */
const buildToiletSummary = (tags: Record<string, string>): string | undefined => {
    const parts: string[] = [];

    if (tags.fee === 'yes' && tags['fee:amount']) {
        parts.push(`Fee: ${tags['fee:amount']}`);
    } else if (tags.fee === 'yes') {
        parts.push('Paid');
    } else if (tags.fee === 'no') {
        parts.push('Free');
    }

    if (tags.wheelchair === 'yes') {
        parts.push('Wheelchair accessible');
    }

    if (tags.changing_table === 'yes') {
        parts.push('Baby changing available');
    }

    if (tags.opening_hours && tags.opening_hours !== '24/7') {
        parts.push(`Hours: ${tags.opening_hours}`);
    } else if (tags.opening_hours === '24/7') {
        parts.push('Open 24/7');
    }

    if (tags.operator) {
        parts.push(`Operated by: ${tags.operator}`);
    }

    return parts.length > 0 ? parts.join(' • ') : undefined;
};
