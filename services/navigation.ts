import { Alert, Linking, Platform } from 'react-native';

export const openMapsApp = async (lat: number, lng: number, label: string) => {
    const latLng = `${lat},${lng}`;
    // Strip emojis and special characters from label for URL safety
    const cleanLabel = label.replace(/[^\w\s-]/g, '').trim() || 'Destination';
    const labelEncoded = encodeURIComponent(cleanLabel);

    // Apple Maps URL (https works on device, may not on simulator)
    const appleUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${labelEncoded}`;

    // Google Maps - try app first, fallback to web
    const googleAppUrl = `comgooglemaps://?q=${latLng}&center=${latLng}&zoom=14`;
    const googleWebUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    const openWithFallback = async (url: string, fallbackUrl: string | null, appName: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else if (fallbackUrl) {
                // Try web fallback
                const webSupported = await Linking.canOpenURL(fallbackUrl);
                if (webSupported) {
                    await Linking.openURL(fallbackUrl);
                } else {
                    showCoordinatesAlert(lat, lng, cleanLabel, appName);
                }
            } else {
                showCoordinatesAlert(lat, lng, cleanLabel, appName);
            }
        } catch (err) {
            console.error(`Error opening ${appName}`, err);
            if (fallbackUrl) {
                try {
                    await Linking.openURL(fallbackUrl);
                } catch {
                    showCoordinatesAlert(lat, lng, cleanLabel, appName);
                }
            } else {
                showCoordinatesAlert(lat, lng, cleanLabel, appName);
            }
        }
    };

    const showCoordinatesAlert = (lat: number, lng: number, label: string, appName: string) => {
        Alert.alert(
            `Can't Open ${appName}`,
            `This may be a simulator limitation.\n\nCoordinates:\n${lat}, ${lng}\n\n${label}`,
            [{ text: 'OK' }]
        );
    };

    if (Platform.OS === 'ios') {
        // Always show choice on iOS
        Alert.alert(
            'Navigate with...',
            'Choose your preferred maps app',
            [
                {
                    text: 'Apple Maps',
                    onPress: () => openWithFallback(appleUrl, null, 'Apple Maps')
                },
                {
                    text: 'Google Maps',
                    onPress: () => openWithFallback(googleAppUrl, googleWebUrl, 'Google Maps')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    } else {
        // Android - Always show choice
        const androidUrl = `geo:${latLng}?q=${latLng}(${labelEncoded})`;
        Alert.alert(
            'Navigate with...',
            'Choose your preferred maps app',
            [
                {
                    text: 'Default Maps',
                    onPress: () => openWithFallback(androidUrl, null, 'Maps')
                },
                {
                    text: 'Google Maps',
                    onPress: () => openWithFallback(googleWebUrl, null, 'Google Maps')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    }
};
