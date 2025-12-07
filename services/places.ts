export type Place = {
    place_id: string;
    name: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    vicinity: string; // Address in nearby search
    plus_code?: {
        global_code: string;
        compound_code: string;
    };
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    photos?: {
        photo_reference: string;
    }[];
    types: string[];
    opening_hours?: {
        open_now: boolean;
    };
};

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export const fetchNearbyPlaces = async (
    latitude: number,
    longitude: number,
    radius: number = 50, // Default 50m as per PRD
    type: string = '' // Optional filter
): Promise<Place[]> => {
    if (!GOOGLE_PLACES_API_KEY) {
        console.error('Google Places API Key is missing!');
        throw new Error('API Key missing');
    }

    // Build URL for Nearby Search (Legacy)
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_PLACES_API_KEY}`;

    if (type && type !== 'all') {
        url += `&type=${type}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            // Filter out pure political/region results to avoid "Prague", "Prague 1", etc.
            const excludedTypes = new Set([
                'locality',
                'political',
                'sublocality',
                'sublocality_level_1',
                'administrative_area_level_1',
                'administrative_area_level_2',
                'postal_code',
                'country'
            ]);

            const places: Place[] = data.results
                .filter((result: any) => {
                    return !result.types.some((t: string) => excludedTypes.has(t));
                })
                .map((result: any) => ({
                    place_id: result.place_id,
                    name: result.name,
                    vicinity: result.vicinity || result.formatted_address,
                    plus_code: result.plus_code,
                    geometry: {
                        location: {
                            lat: result.geometry.location.lat,
                            lng: result.geometry.location.lng,
                        },
                    },
                    rating: result.rating,
                    user_ratings_total: result.user_ratings_total,
                    price_level: result.price_level,
                    photos: result.photos,
                    types: result.types,
                    opening_hours: result.opening_hours,
                }));
            return places;
        } else if (data.status === 'ZERO_RESULTS') {
            return [];
        } else {
            console.error('Places API Error:', data.status, data.error_message);
            throw new Error(data.error_message || 'Places API Error');
        }
    } catch (error) {
        console.error('Error fetching places:', error);
        throw error;
    }
};

export const fetchPlaceDetails = async (placeId: string): Promise<string | null> => {
    if (!GOOGLE_PLACES_API_KEY) {
        throw new Error('API Key missing');
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components&key=${GOOGLE_PLACES_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            const components = data.result.address_components;
            // Look for 'locality' (City)
            let cityComponent = components.find((c: any) => c.types.includes('locality'));

            // Fallback to 'postal_town' (often used in UK/Europe)
            if (!cityComponent) {
                cityComponent = components.find((c: any) => c.types.includes('postal_town'));
            }

            // Fallback to 'administrative_area_level_2' (County/District) if needed
            if (!cityComponent) {
                cityComponent = components.find((c: any) => c.types.includes('administrative_area_level_2'));
            }

            // Last resort: 'administrative_area_level_1' (State/Province) - maybe too broad but better than nothing
            if (!cityComponent) {
                cityComponent = components.find((c: any) => c.types.includes('administrative_area_level_1'));
            }

            return cityComponent ? cityComponent.long_name : null;
        } else {
            console.warn('Place Details not OK:', data.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        return null;
    }
};
