import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from './places';

const STORAGE_KEY = 'HAPPYMAP_SAVED_PLACES';

// Extend Place with a saved timestamp or other metadata if needed
export type SavedPlace = Place & {
    savedAt: number;
    city?: string; // Canonical City Name from Google
    // Add custom notes etc later
};

export const savePlace = async (place: Place & { city?: string }): Promise<void> => {
    try {
        const currentSaved = await getSavedPlaces();
        // Check if already saved to prevent duplicates
        if (currentSaved.some((p) => p.place_id === place.place_id)) {
            return;
        }

        const newSavedPlace: SavedPlace = { ...place, savedAt: Date.now() };
        const updatedList = [...currentSaved, newSavedPlace];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
        console.error('Failed to save place', e);
    }
};

export const updateSavedPlace = async (placeId: string, updates: Partial<SavedPlace>): Promise<void> => {
    try {
        const currentSaved = await getSavedPlaces();
        const updatedList = currentSaved.map(p =>
            p.place_id === placeId ? { ...p, ...updates } : p
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
        console.error('Failed to update place', e);
    }
}

export const getSavedPlaces = async (): Promise<SavedPlace[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to fetch saved places', e);
        return [];
    }
};

export const removePlace = async (placeId: string): Promise<void> => {
    try {
        const currentSaved = await getSavedPlaces();
        const updatedList = currentSaved.filter((p) => p.place_id !== placeId);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
        console.error('Failed to remove place', e);
    }
};

export const removeAllPlaces = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to remove all places', e);
    }
};

export const isPlaceSaved = async (placeId: string): Promise<boolean> => {
    const currentSaved = await getSavedPlaces();
    return currentSaved.some((p) => p.place_id === placeId);
}
