import { Alert, Linking, Platform } from 'react-native';

export const openMapsApp = async (latitude: number, longitude: number, label: string) => {
    const latLng = `${latitude},${longitude}`;
    const labelEncoded = encodeURIComponent(label);

    if (Platform.OS === 'ios') {
        const googleMapsUrl = `comgooglemaps://?q=${labelEncoded}&center=${latLng}`;
        const appleMapsUrl = `maps:0,0?q=${labelEncoded}&ll=${latLng}`;

        const canOpenGoogleMaps = await Linking.canOpenURL('comgooglemaps://');

        if (canOpenGoogleMaps) {
            Alert.alert(
                'Open in Maps',
                'Choose an app to navigate',
                [
                    {
                        text: 'Apple Maps',
                        onPress: () => Linking.openURL(appleMapsUrl)
                    },
                    {
                        text: 'Google Maps',
                        onPress: () => Linking.openURL(googleMapsUrl)
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            Linking.openURL(appleMapsUrl);
        }
    } else {
        // Android
        const url = `geo:${latLng}?q=${latLng}(${labelEncoded})`;
        Linking.openURL(url);
    }
};
