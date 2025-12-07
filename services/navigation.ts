import { Alert, Linking, Platform } from 'react-native';

export const openMapsApp = async (lat: number, lng: number, label: string) => {
    const latLng = `${lat},${lng}`;
    const labelEncoded = encodeURIComponent(label);

    // Use standard HTTPS URL for Apple Maps which is safer to open
    const appleUrl = `http://maps.apple.com/?ll=${lat},${lng}&q=${labelEncoded}`;
    const googleUrl = `comgooglemaps://?q=${latLng}(${labelEncoded})&center=${latLng}&zoom=14&views=traffic`;

    if (Platform.OS === 'ios') {
        const canOpenGoogleMaps = await Linking.canOpenURL('comgooglemaps://');

        if (canOpenGoogleMaps) {
            Alert.alert(
                'Navigate with...',
                'Choose your preferred maps app',
                [
                    {
                        text: 'Apple Maps',
                        onPress: () => Linking.openURL(appleUrl)
                    },
                    {
                        text: 'Google Maps',
                        onPress: () => Linking.openURL(googleUrl)
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            Linking.openURL(appleUrl);
        }
    } else {
        // Android - Intent usually handles choice
        const androidUrl = `geo:${latLng}?q=${latLng}(${labelEncoded})`;
        Linking.openURL(androidUrl);
    }
};
