import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';

export type UserLocation = {
    latitude: number;
    longitude: number;
} | null;

export const useUserLocation = () => {
    const [location, setLocation] = useState<UserLocation>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const requestLocation = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                Alert.alert('Permission Denied', 'Allow location access to find places near you.');
                setIsLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            console.log('Location acquired:', location.coords);
            setLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            setErrorMsg('Could not fetch location');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Optional: Auto-fetch on mount, or leave it for the button press
    // For HappyMap, we want "One Button" scan, so maybe we only fetch on specific action?
    // But usually we need a fix before the scan? 
    // PRD 2.1.1: "The app retrieves their current GPS position (when button pressed)"
    // So we expose the request function.

    return { location, errorMsg, isLoading, requestLocation };
};
