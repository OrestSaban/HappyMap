import CustomMarker from '@/components/CustomMarker';
import PlaceDetailCard, { PlaceDetailCardRef } from '@/components/PlaceDetailCard';
import { View } from '@/components/Themed'; // Use Safe View
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getSavedPlaces, SavedPlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapScreen() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const cardRef = useRef<PlaceDetailCardRef>(null);

  const { location, requestLocation } = useUserLocation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useFocusEffect(
    useCallback(() => {
      const loadPlaces = async () => {
        const places = await getSavedPlaces();
        setSavedPlaces(places);
      };
      loadPlaces();
      requestLocation();
    }, [])
  );

  const handleMarkerPress = (place: SavedPlace) => {
    setSelectedPlace(place);
  };

  const handleMapPress = () => {
    if (selectedPlace && cardRef.current) {
      // Trigger close animation first
      cardRef.current.close();
    } else if (selectedPlace) {
      // Fallback
      setSelectedPlace(null);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        // Specific Wolt-like config:
        // iOS: Default provider (Apple Maps) for better 3D buildings
        // Android: Google Maps
        provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false} // Custom button usually better, or standard ok
        showsBuildings={true}
        showsPointsOfInterest={false} // Clean map
        showsCompass={false}
        showsScale={false}
        showsIndoors={false}
        tintColor={theme.primary}
        userInterfaceStyle={colorScheme ?? 'light'}
        initialRegion={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        onPress={handleMapPress}
      >
        {savedPlaces.map((place) => (
          <Marker
            key={place.place_id}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={undefined} // Hide default callout
            description={undefined}
            onPress={(e) => {
              e.stopPropagation();
              handleMarkerPress(place);
            }}
            tracksViewChanges={true} // Fixes "left corner" and "invisible pin" issues at cost of perf
          >
            <CustomMarker
              types={place.types}
              selected={selectedPlace?.place_id === place.place_id}
            />
          </Marker>
        ))}
      </MapView>

      {/* Place Detail Card (Bottom Sheet) */}
      {selectedPlace && (
        <PlaceDetailCard
          ref={cardRef}
          place={selectedPlace}
          theme={theme}
          onClose={() => setSelectedPlace(null)}
        />
      )}

      {/* Empty State Overlay */}
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
    bottom: 100,
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
    zIndex: 5,
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
