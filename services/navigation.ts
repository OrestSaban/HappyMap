import { Alert, Linking, Platform } from 'react-native';

export const openMapsApp = async (lat: number, lng: number, label: string) => {
    const latLng = `${lat},${lng}`;
    const labelEncoded = encodeURIComponent(label);

    // Use maps: scheme for Apple Maps which is more robust on Simulator/Device
    const appleUrl = `maps:0,0?q=${labelEncoded}&ll=${lat},${lng}`;
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
                        onPress: () => Linking.openURL(appleUrl).catch(err => console.error("Error opening Apple Maps", err))
                    },
                    {
                        text: 'Google Maps',
                        onPress: () => Linking.openURL(googleUrl).catch(err => console.error("Error opening Google Maps", err))
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            Linking.openURL(appleUrl).catch(err => console.error("Error opening Apple Maps", err));
        }
    } else {
        // Android - Intent usually handles choice
        const androidUrl = `geo:${latLng}?q=${latLng}(${labelEncoded})`;
        Linking.openURL(androidUrl).catch(err => console.error("Error opening Android Maps", err));
    }
};
