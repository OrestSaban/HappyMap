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
    radius: number = 300,
    type: string = '' // Unused in V1 strict mode, kept for signature compatibility
): Promise<Place[]> => {
    if (!GOOGLE_PLACES_API_KEY) {
        console.error('Google Places API Key is missing!');
        throw new Error('API Key missing');
    }

    const url = 'https://places.googleapis.com/v1/places:searchNearby';

    // Strict Whitelist for V1 API
    const includedTypes = [
        'restaurant',
        'cafe',
        'bar',
        'bakery',
        'park',
        'tourist_attraction',
        'museum',
        'art_gallery',
        'night_club',
        'stadium'
    ];

    const requestBody = {
        includedTypes: includedTypes,
        maxResultCount: 20,
        locationRestriction: {
            circle: {
                center: {
                    latitude: latitude,
                    longitude: longitude
                },
                radius: radius
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.photos'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.error) {
            console.error('Places V1 API Error:', data.error);
            throw new Error(data.error.message || 'Places API Error');
        }

        const places: Place[] = (data.places || []).map((place: any) => {
            // Helper to map Price Level Enum to Number
            let priceLevel = undefined;
            const pLevel = place.priceLevel;
            if (pLevel === 'PRICE_LEVEL_INEXPENSIVE') priceLevel = 1;
            else if (pLevel === 'PRICE_LEVEL_MODERATE') priceLevel = 2;
            else if (pLevel === 'PRICE_LEVEL_EXPENSIVE') priceLevel = 3;
            else if (pLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') priceLevel = 4;

            return {
                place_id: place.id,
                name: place.displayName?.text || 'Unknown Place',
                vicinity: place.formattedAddress || '',
                // V1 doesn't return plus_code in standard mask easily, skipping or needs extra field. 
                // For now, keeping structure compatible.
                geometry: {
                    location: {
                        lat: place.location.latitude,
                        lng: place.location.longitude,
                    },
                },
                rating: place.rating,
                user_ratings_total: place.userRatingCount,
                price_level: priceLevel,
                photos: place.photos ? place.photos.map((p: any) => ({ photo_reference: p.name })) : undefined, // V1 photos use 'name' as resource ID
                types: place.types,
                opening_hours: place.regularOpeningHours ? { open_now: place.regularOpeningHours.openNow } : undefined,
            };
        });

        return places;

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
