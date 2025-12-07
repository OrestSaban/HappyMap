import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { fetchNearbyPlaces, fetchPlaceDetails, Place } from '@/services/places';
import { getSavedPlaces, removePlace, savePlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleScan = async () => {
    setPlaces([]);
    setScanStatus('Acquiring User Location...');
    await requestLocation();
  };

  useEffect(() => {
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
          const results = await fetchNearbyPlaces(location.latitude, location.longitude, 100, '');
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
  const hasPerformedScan = places.length > 0 || scanStatus.includes('No places');

  // Logic: Show Scan Button if we haven't scanned yet, OR if we scanned effectively but found nothing (and user clears filter or decides to rescan)
  // Logic Fix: If we HAVE places (`places.length > 0`) but filtered list is empty, SHOW "No Results in Category" message.

  const showScanButton = !hasPerformedScan && places.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>HappyMap</Text>
        <Text style={[styles.subtitle, { color: theme.textLight }]}>Discover joy around you</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.card, borderColor: theme.textLight, shadowColor: theme.text },
                  isActive && { backgroundColor: theme.accent, borderColor: theme.accent }
                ]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isActive ? '#fff' : theme.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.filterText, { color: theme.text }, isActive && styles.filterTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.mainContent}>
        {showScanButton && !isLoading ? (
          <View style={styles.scanContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleScan}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.primary, theme.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.scanButton, { shadowColor: theme.primary }]}
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
              {location && <Text style={[styles.locationText, { color: theme.textLight }]}>{scanStatus}</Text>}
              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* If we have places but filter returns none */}
            {!isLoading && places.length > 0 && filteredPlaces.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="search-outline" size={48} color={theme.textLight} />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>
                  No {CATEGORIES.find(c => c.id === selectedCategory)?.label} found nearby.
                </Text>
                <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                  <Text style={[styles.clearText, { color: theme.primary, marginTop: 10 }]}>View All Places</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.resultsList}
                contentContainerStyle={styles.resultsContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.listHeader}>
                  <Text style={[styles.resultsTitle, { color: theme.text }]}>
                    Found {filteredPlaces.length} places
                  </Text>
                  <TouchableOpacity onPress={() => { setPlaces([]); setScanStatus(''); }}>
                    <Text style={[styles.clearText, { color: theme.primary }]}>Clear & Rescan</Text>
                  </TouchableOpacity>
                </View>

                {filteredPlaces.map((place) => {
                  const isSaved = savedPlaceIds.has(place.place_id);
                  return (
                    <View key={place.place_id} style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                      <TouchableOpacity style={styles.cardContent} onPress={() => handlePlacePress(place)}>
                        <View style={[styles.cardIcon, { backgroundColor: theme.background }]}>
                          <Ionicons name="location" size={24} color={theme.accent} />
                        </View>
                        <View style={styles.cardText}>
                          <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>{place.name}</Text>
                          <Text style={[styles.placeVicinity, { color: theme.textLight }]} numberOfLines={1}>{place.vicinity}</Text>
                          <View style={[styles.tagContainer, { backgroundColor: theme.background }]}>
                            <Text style={[styles.categoryTag, { color: theme.primary }]}>{place.types[0]?.replace('_', ' ')}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.heartButton} onPress={() => toggleSave(place)}>
                        <Ionicons
                          name={isSaved ? "heart" : "heart-outline"}
                          size={28}
                          color={theme.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <View style={{ height: 100 }} />
              </ScrollView>
            )}
            {/* Loading State Overlay if needed, usually handled by scan button replacement but here for location updates */}
            {isLoading && (
              <View style={[styles.loadingOverlay, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>{scanStatus}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
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
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF4B4B',
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
  },
  clearText: {
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
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
    marginBottom: 2,
  },
  placeVicinity: {
    fontSize: 13,
    marginBottom: 6,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heartButton: {
    padding: 10,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  }
});
