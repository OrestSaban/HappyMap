import { Text, View } from '@/components/Themed'; // Use Safe View
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getSavedPlaces, SavedPlace } from '@/services/storage'; // Changed from Place to SavedPlace to match original type
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native'; // Removed Alert
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Removed PROVIDER_DEFAULT

export default function MapScreen() { // Renamed from TabTwoScreen to MapScreen to match original
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]); // Changed from Place to SavedPlace to match original type
  const { location, requestLocation } = useUserLocation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useFocusEffect(
    useCallback(() => {
      const loadPlaces = async () => { // Renamed from load to loadPlaces
        const places = await getSavedPlaces();
        setSavedPlaces(places);
      };
      loadPlaces();
      // Ensure we have location permission on map view too
      requestLocation();
    }, [])
  );

  const handleMarkerPress = (place: SavedPlace) => { // Renamed from handleCalloutPress to handleMarkerPress, and type from Place to SavedPlace
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
        provider={PROVIDER_GOOGLE} // Set provider to PROVIDER_GOOGLE
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
