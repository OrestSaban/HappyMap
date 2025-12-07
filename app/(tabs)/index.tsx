import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { fetchNearbyPlaces, fetchPlaceDetails, getPlacePhotoUrl, Place, searchPlacesByText } from '@/services/places';
import { getSavedPlaces, removePlace, savePlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';

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
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleScan = async () => {
    setPlaces([]);
    setSearchQuery('');
    setScanStatus('Acquiring User Location...');
    await requestLocation();
  };

  const handleGlobalSearch = async () => {
    if (!location || !searchQuery.trim()) return;

    setPlaces([]);
    setScanStatus(`Searching Google for "${searchQuery}"...`);
    setIsPlacesLoading(true);

    try {
      const results = await searchPlacesByText(searchQuery, location.latitude, location.longitude);
      setPlaces(results);
      setScanStatus(results.length > 0 ? `Found ${results.length} results for "${searchQuery}"` : `No results for "${searchQuery}"`);
      // Reset category to 'all' so we see the results
      setSelectedCategory('all');
    } catch (e) {
      setScanStatus('Error searching places');
      console.error(e);
    } finally {
      setIsPlacesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadSaved = async () => {
        const saved = await getSavedPlaces();
        setSavedPlaceIds(new Set(saved.map(p => p.place_id)));
      };
      loadSaved();
    }, [])
  );

  useEffect(() => {
    if (location) {
      const getPlaces = async () => {
        setScanStatus('Fetching nearby places...');
        setIsPlacesLoading(true);
        try {
          const results = await fetchNearbyPlaces(location.latitude, location.longitude, 300, '');
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

  const filteredPlaces = places
    .filter(place => {
      // 1. Filter by Category
      if (selectedCategory !== 'all') {
        const CategoryObj = CATEGORIES.find(c => c.id === selectedCategory);
        if (CategoryObj && !place.types.some(t => CategoryObj.types.includes(t))) {
          return false;
        }
      }
      // 2. Filter by Search Query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        return place.name.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by Rating (Descending), places with no rating go last
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });

  const isLoading = isLocationLoading || isPlacesLoading;
  const hasPerformedScan = places.length > 0 || scanStatus.includes('No places');
  const showScanButton = !hasPerformedScan && places.length === 0;

  // Helper to render stars
  const renderRating = (rating?: number, total?: number) => {
    if (!rating) return null;
    return (
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={12} color="#FFD700" />
        <Text style={[styles.ratingText, { color: theme.text }]}>{rating}</Text>
        {total ? <Text style={[styles.ratingCount, { color: theme.textLight }]}>({total})</Text> : null}
      </View>
    );
  };

  // Helper for Price Level
  const renderPrice = (level?: number) => {
    if (level === undefined) return null;
    const dollars = '$'.repeat(level || 1);
    return <Text style={[styles.priceText, { color: theme.textLight }]}>{dollars}</Text>;
  };

  // Helper for Open Status
  const renderOpenStatus = (openNow?: boolean) => {
    if (openNow === undefined) return null;
    return (
      <View style={[styles.badge, openNow ? { backgroundColor: '#E6F8EF' } : { backgroundColor: '#FFF5F5' }]}>
        <Text style={[styles.badgeText, openNow ? { color: '#00B894' } : { color: '#FF7675' }]}>
          {openNow ? 'Open Now' : 'Closed'}
        </Text>
      </View>
    );
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

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
              <View style={{ flex: 1 }}>
                <View style={styles.searchContainer}>
                  <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.textLight }]}>
                    <Ionicons name="search" size={20} color={theme.textLight} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search found places..."
                      placeholderTextColor={theme.textLight}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.textLight} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.emptyStateContainer}>
                  <Ionicons name="search-outline" size={48} color={theme.textLight} />
                  <Text style={[styles.emptyStateText, { color: theme.text }]}>
                    No matches found.
                  </Text>
                  <TouchableOpacity onPress={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                    <Text style={[styles.clearText, { color: theme.primary, marginTop: 10 }]}>Clear Filters</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.globalSearchButton, { backgroundColor: theme.card, borderColor: theme.primary, marginTop: 20 }]}
                    onPress={handleGlobalSearch}
                  >
                    <Ionicons name="globe-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.globalSearchText, { color: theme.primary }]}>
                      Search Google Maps for "{searchQuery}"
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={styles.searchContainer}>
                  <View style={[styles.searchInputWrapper, { backgroundColor: theme.card, borderColor: theme.textLight }]}>
                    <Ionicons name="search" size={20} color={theme.textLight} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search found places..."
                      placeholderTextColor={theme.textLight}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.textLight} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <ScrollView
                  style={styles.resultsList}
                  contentContainerStyle={styles.resultsContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.listHeader}>
                    <Text style={[styles.resultsTitle, { color: theme.text }]}>
                      Found {filteredPlaces.length} places
                    </Text>
                    <TouchableOpacity onPress={() => { setPlaces([]); setScanStatus(''); setSearchQuery(''); }}>
                      <Text style={[styles.clearText, { color: theme.primary }]}>Clear & Rescan</Text>
                    </TouchableOpacity>
                  </View>

                  {filteredPlaces.map((place) => {
                    const isSaved = savedPlaceIds.has(place.place_id);
                    const photoUrl = place.photos?.[0]?.name ? getPlacePhotoUrl(place.photos[0].name) : null;

                    return (
                      <View key={place.place_id} style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <TouchableOpacity style={styles.cardContent} onPress={() => handlePlacePress(place)}>
                          {photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.cardInfoImage} />
                          ) : (
                            <View style={[styles.cardIcon, { backgroundColor: theme.background }]}>
                              <Ionicons name="location" size={24} color={theme.accent} />
                            </View>
                          )}

                          <View style={styles.cardText}>
                            <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>{place.name}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.placeVicinity, { color: theme.textLight, flex: 1 }]} numberOfLines={1}>{place.vicinity}</Text>
                              {place.distance && (
                                <Text style={[styles.distanceText, { color: theme.primary }]}>{formatDistance(place.distance)}</Text>
                              )}
                            </View>

                            <View style={styles.detailRow}>
                              {renderRating(place.rating, place.user_ratings_total)}
                              {renderPrice(place.price_level)}
                            </View>

                            <View style={styles.metaRow}>
                              <View style={[styles.tagContainer, { backgroundColor: theme.background }]}>
                                <Text style={[styles.categoryTag, { color: theme.primary }]}>{place.types[0]?.replace('_', ' ')}</Text>
                              </View>
                              {renderOpenStatus(place.opening_hours?.open_now)}
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


                  {/* Footer Global Search Option */}
                  {searchQuery.length > 0 && (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[styles.globalSearchButton, { backgroundColor: theme.card, borderColor: theme.primary }]}
                        onPress={handleGlobalSearch}
                      >
                        <Ionicons name="globe-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                        <Text style={[styles.globalSearchText, { color: theme.primary }]}>
                          Search Google Maps for "{searchQuery}"
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={{ height: 100 }} />
                </ScrollView>
              </View>
            )}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
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
    alignItems: 'flex-start', // Align to top
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardInfoImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#eee'
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
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
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  globalSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  globalSearchText: {
    fontWeight: '700',
    fontSize: 14,
  }
});
