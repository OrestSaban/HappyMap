import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { fetchNearbyPlaces, fetchPlaceDetails, Place } from '@/services/places';
import { getSavedPlaces, removePlace, savePlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Platform, ScrollView, StyleSheet, TouchableOpacity, UIManager } from 'react-native';

const CATEGORIES = [
  { id: 'all', label: 'All', types: [], icon: 'grid-outline' },
  { id: 'cafe', label: 'Cafés', types: ['cafe', 'bakery', 'coffee_shop'], icon: 'cafe-outline' },
  { id: 'restaurant', label: 'Food', types: ['restaurant', 'food'], icon: 'restaurant-outline' },
  { id: 'bar', label: 'Bars', types: ['bar', 'night_club'], icon: 'wine-outline' },
  { id: 'park', label: 'Parks', types: ['park'], icon: 'leaf-outline' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TabOneScreen() {
  const { location, errorMsg, isLoading: isLocationLoading, requestLocation } = useUserLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  const handleScan = async () => {
    setPlaces([]);
    setScanStatus('Acquiring User Location...');
    await requestLocation();
    // Logic continues in useEffect when location updates
  };

  useEffect(() => {
    // Load saved places on mount to know what is already saved
    const loadSaved = async () => {
      const saved = await getSavedPlaces();
      setSavedPlaceIds(new Set(saved.map(p => p.place_id)));
    };
    loadSaved();
  }, []);

  useEffect(() => {
    if (location) {
      const getPlaces = async () => {
        setScanStatus('Fetching nearby places...');
        setIsPlacesLoading(true);
        try {
          const results = await fetchNearbyPlaces(location.latitude, location.longitude, 50, '');
          setPlaces(results);
          setScanStatus(results.length > 0 ? `Found ${results.length} places!` : 'No places found nearby.');
        } catch (e) {
          setScanStatus('Error fetching places');
          console.error(e);
        } finally {
          setIsPlacesLoading(false);
        }
      };
      getPlaces();
    }
  }, [location]);

  const toggleSave = async (place: Place) => {
    const isSaved = savedPlaceIds.has(place.place_id);
    // Optimistic UI Update
    setSavedPlaceIds(prev => {
      const newSet = new Set(prev);
      if (isSaved) newSet.delete(place.place_id);
      else newSet.add(place.place_id);
      return newSet;
    });

    try {
      if (isSaved) {
        await removePlace(place.place_id);
      } else {
        let city = undefined;
        try {
          const canonicalCity = await fetchPlaceDetails(place.place_id);
          if (canonicalCity) city = canonicalCity;
        } catch (e) {
          console.warn('Failed to fetch city details on save', e);
        }
        const placeToSave = { ...place, city };
        await savePlace(placeToSave);
      }
    } catch (e) {
      console.error("Save failed", e);
      // Revert on failure
      setSavedPlaceIds(prev => {
        const newSet = new Set(prev);
        if (isSaved) newSet.add(place.place_id);
        else newSet.delete(place.place_id);
        return newSet;
      });
    }
  };

  const handleCategorySelect = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(id);
  };

  const handlePlacePress = (place: Place) => {
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

  const filteredPlaces = places.filter(place => {
    if (selectedCategory === 'all') return true;
    const CategoryObj = CATEGORIES.find(c => c.id === selectedCategory);
    if (!CategoryObj) return true;
    return place.types.some(t => CategoryObj.types.includes(t));
  });

  const isLoading = isLocationLoading || isPlacesLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HappyMap</Text>
        <Text style={styles.subtitle}>Discover joy around you</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isActive ? '#fff' : Colors.light.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.mainContent}>
        {filteredPlaces.length === 0 && !isLoading ? (
          <View style={styles.scanContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleScan}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FF4B4B', '#FFD700']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scanButton}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="scan-outline" size={48} color="#fff" />
                    <Text style={styles.scanButtonText}>SCAN</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.statusContainer}>
              {location && <Text style={styles.locationText}>{scanStatus}</Text>}
              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.listHeader}>
              <Text style={styles.resultsTitle}>
                Found {filteredPlaces.length} places
              </Text>
              <TouchableOpacity onPress={() => setPlaces([])}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {filteredPlaces.map((place) => {
              const isSaved = savedPlaceIds.has(place.place_id);
              return (
                <View key={place.place_id} style={styles.card}>
                  <TouchableOpacity style={styles.cardContent} onPress={() => handlePlacePress(place)}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="location" size={24} color={Colors.light.accent} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                      <Text style={styles.placeVicinity} numberOfLines={1}>{place.vicinity}</Text>
                      <View style={styles.tagContainer}>
                        <Text style={styles.categoryTag}>{place.types[0]?.replace('_', ' ')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.heartButton} onPress={() => toggleSave(place)}>
                    <Ionicons
                      name={isSaved ? "heart" : "heart-outline"}
                      size={28}
                      color={Colors.light.primary}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  filterContainer: {
    height: 50,
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: Colors.light.accent,
    borderColor: Colors.light.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  scanContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  scanButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 10,
  },
  statusContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  locationText: {
    color: Colors.light.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: 10,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsContent: {
    paddingBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  clearText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardText: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  placeVicinity: {
    fontSize: 13,
    color: Colors.light.textLight,
    marginBottom: 6,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTag: {
    fontSize: 10,
    color: Colors.light.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heartButton: {
    padding: 10,
  }
});
