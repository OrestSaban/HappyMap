import { useUserLocation } from '@/hooks/useUserLocation';
import { getSavedPlaces, SavedPlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapScreen() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isGoogleMaps, setIsGoogleMaps] = useState(false);
  const { location, requestLocation } = useUserLocation();
  const router = useRouter();
  const navigation = useNavigation();

  const showMapSettings = useCallback(() => {
    Alert.alert(
      "Map Settings",
      "Choose Map Provider",
      [
        {
          text: "Apple Maps (Default)",
          onPress: () => setIsGoogleMaps(false),
          style: isGoogleMaps ? 'default' : 'cancel' // Highlight selected? Alert doesn't really support 'selected' state easily, but we can just set it.
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
      headerRight: () => (
        <TouchableOpacity onPress={showMapSettings} style={{ marginRight: 15 }}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showMapSettings]);

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
    // For markers, we often want to show a callout first.
    // But for 'one tap' feel, opening modal is also fine.
    // Let's use callout press to open details, or just regular press if user prefers.
    // PRD says: "Tapping a place on the map opens a simple details sheet" (2.4 Map Interaction)
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
        // Default to user location if available, otherwise some default or last saved place
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
            onCalloutPress={() => handleMarkerPress(place)}
          />
        ))}
      </MapView>

      {savedPlaces.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>No saved places yet.</Text>
          <Text style={styles.emptySubText}>Go to Discovery tab to find and save places!</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
