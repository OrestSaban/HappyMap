import { Text, View } from '@/components/Themed'; // Use Safe View
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getSavedPlaces, SavedPlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapScreen() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);
  const { location, requestLocation } = useUserLocation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const showMapSettings = useCallback(() => {
    Alert.alert(
      "Map Settings",
      "Choose Map Provider",
      [
        {
          text: "Apple Maps (Default)",
          onPress: () => setIsGoogleMaps(false),
          style: isGoogleMaps ? 'default' : 'cancel'
        },
        {
          text: "Google Maps",
          onPress: () => setIsGoogleMaps(true),
          style: isGoogleMaps ? 'cancel' : 'default'
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  }, [isGoogleMaps]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTintColor: theme.primary,
      headerRight: () => (
        <TouchableOpacity onPress={showMapSettings} style={{ marginRight: 15 }}>
          <Ionicons name="settings-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showMapSettings, theme]);

  useFocusEffect(
    useCallback(() => {
      const loadPlaces = async () => {
        const places = await getSavedPlaces();
        setSavedPlaces(places);
      };
      loadPlaces();
    }, [])
  );

  const handleMarkerPress = (place: SavedPlace) => {
    router.push({
      pathname: '/modal',
      params: {
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      }
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={isGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={true}
        tintColor={theme.primary}
        userInterfaceStyle={colorScheme ?? 'light'}
        region={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
      >
        {savedPlaces.map((place) => (
          <Marker
            key={place.place_id}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
            pinColor={theme.primary}
            onCalloutPress={() => handleMarkerPress(place)}
          />
        ))}
      </MapView>

      {savedPlaces.length === 0 && (
        <View style={[styles.emptyOverlay, { backgroundColor: theme.card }]}>
          <Ionicons name="map" size={48} color={theme.textLight} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No saved places yet</Text>
          <Text style={[styles.emptySubText, { color: theme.textLight }]}>Places you save will appear here.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    opacity: 0.95,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
