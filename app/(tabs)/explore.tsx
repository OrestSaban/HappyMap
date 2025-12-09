import { useColorScheme } from '@/components/useColorScheme';
import { CATEGORIES } from '@/constants/Categories';
import Colors from '@/constants/Colors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { fetchNearbyPlaces, fetchPlaceDetails, getPlacePhotoUrl, Place } from '@/services/places';
import { getSavedPlaces, removePlace, savePlace } from '@/services/storage';
import { fetchNearbyToilets } from '@/services/toilets';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Categories to exclude from Explore tab (e.g. 'all' is too generic)
const EXPLORE_CATEGORIES = CATEGORIES.filter(c => c.id !== 'all');

export default function ExploreTab() {
    const { location, requestLocation } = useUserLocation();
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [categoryData, setCategoryData] = useState<{ [key: string]: Place[] }>({});
    const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
    const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        const loadSaved = async () => {
            const saved = await getSavedPlaces();
            setSavedPlaceIds(new Set(saved.map(p => p.place_id)));
        };
        loadSaved();
        if (!location) {
            requestLocation();
        }
    }, []);

    const toggleCategory = async (categoryId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (expandedCategory === categoryId) {
            setExpandedCategory(null);
            return;
        }

        setExpandedCategory(categoryId);

        // If data already exists, don't re-fetch
        if (categoryData[categoryId]) return;

        if (!location) {
            await requestLocation();
            return;
        }

        setLoadingCategory(categoryId);

        try {
            let results: Place[] = [];
            const catObj = CATEGORIES.find(c => c.id === categoryId);

            if (categoryId === 'toilet') {
                results = await fetchNearbyToilets(location.latitude, location.longitude, 2000); // 2km for toilets
            } else {
                // Fetch 20 nearest places
                // Google Places API (v1) automatically returns up to 20 results.
                // We use a decent radius (2km) to ensure we find things, but sort by distance.
                // Note: fetchNearbyPlaces returns { results, mode }. We just want results.
                const response = await fetchNearbyPlaces(location.latitude, location.longitude, 5000, catObj?.types);

                results = response.results;

                // FILTER: Drop low rated places (< 3.5), except for categories that might not have ratings (like parking)
                // Parking and Toilets usually don't have ratings.
                if (categoryId !== 'parking' && categoryId !== 'toilet' && categoryId !== 'gas_station') {
                    results = results.filter(p => !p.rating || p.rating >= 3.5);
                }
            }

            setCategoryData(prev => ({ ...prev, [categoryId]: results }));
        } catch (e) {
            console.error(`Error fetching ${categoryId}`, e);
        } finally {
            setLoadingCategory(null);
        }
    };

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
                    // ignore
                }
                const placeToSave = { ...place, city };
                await savePlace(placeToSave);
            }
        } catch (e) {
            // revert unique optimistic update
            setSavedPlaceIds(prev => {
                const newSet = new Set(prev);
                if (isSaved) newSet.add(place.place_id);
                else newSet.delete(place.place_id);
                return newSet;
            });
        }
    };

    const handlePlacePress = (place: Place) => {
        const isToilet = place.types.includes('toilet') || place.types.includes('restroom');
        if (isToilet) {
            router.push({
                pathname: '/toilet-modal',
                params: {
                    name: place.name,
                    vicinity: place.vicinity,
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng,
                    distance: place.distance ? (place.distance < 1000 ? `${Math.round(place.distance)}m` : `${(place.distance / 1000).toFixed(1)}km`) : undefined,
                }
            });
        } else {
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
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Explore</Text>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {EXPLORE_CATEGORIES.map(cat => {
                    const isExpanded = expandedCategory === cat.id;
                    const places = categoryData[cat.id] || [];
                    const isLoading = loadingCategory === cat.id;

                    return (
                        <View key={cat.id} style={[styles.categoryCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                            <TouchableOpacity
                                style={styles.categoryHeader}
                                onPress={() => toggleCategory(cat.id)}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.iconContainer, { backgroundColor: isExpanded ? theme.primary : theme.background }]}>
                                        <Ionicons name={cat.icon as any} size={24} color={isExpanded ? '#fff' : theme.text} />
                                    </View>
                                    <Text style={[styles.categoryTitle, { color: theme.text }]}>{cat.label}</Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={theme.textLight}
                                />
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.resultsContainer}>
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
                                    ) : places.length === 0 ? (
                                        <Text style={[styles.noResultText, { color: theme.textLight }]}>No places found nearby.</Text>
                                    ) : (
                                        places.map(place => {
                                            const isSaved = savedPlaceIds.has(place.place_id);
                                            const photoUrl = place.photos?.[0]?.name ? getPlacePhotoUrl(place.photos[0].name) : null;
                                            const isToilet = place.types.includes('toilet');

                                            return (
                                                <View key={place.place_id} style={styles.placeItem}>
                                                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => handlePlacePress(place)}>
                                                        {photoUrl && !isToilet ? (
                                                            <Image source={{ uri: photoUrl }} style={styles.placeImage} />
                                                        ) : (
                                                            <View style={[styles.placeIconPlaceholder, { backgroundColor: theme.background }]}>
                                                                <Ionicons name="location" size={20} color={theme.textLight} />
                                                            </View>
                                                        )}

                                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                                            <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>{place.name}</Text>
                                                            <Text style={[styles.placeVicinity, { color: theme.textLight }]}>{place.vicinity}</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                {place.rating && !isToilet && (
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                                                                        <Ionicons name="star" size={12} color="#FFD700" />
                                                                        <Text style={[styles.ratingText, { color: theme.text }]}>{place.rating}</Text>
                                                                    </View>
                                                                )}
                                                                {place.distance && (
                                                                    <Text style={[styles.distanceText, { color: theme.primary }]}>
                                                                        {place.distance < 1000 ? `${Math.round(place.distance)}m` : `${(place.distance / 1000).toFixed(1)}km`}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity style={{ padding: 10 }} onPress={() => toggleSave(place)}>
                                                        <Ionicons name={isSaved ? "heart" : "heart-outline"} size={22} color={theme.primary} />
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    categoryCard: {
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    resultsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
    },
    noResultText: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
    },
    placeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0',
    },
    placeImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    placeIconPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeName: {
        fontSize: 16,
        fontWeight: '600',
    },
    placeVicinity: {
        fontSize: 13,
        marginTop: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
