import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchPlaceDetails, getPlacePhotoUrl } from '@/services/places';
import { getSavedPlaces, removeAllPlaces, removePlace, SavedPlace, updateSavedPlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, LayoutAnimation, Platform, SectionList, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Section {
    title: string;
    data: SavedPlace[];
}

export default function SavedScreen() {
    const [sections, setSections] = useState<Section[]>([]);
    const [expandedCity, setExpandedCity] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const loadPlaces = async () => {
        setIsLoading(true);
        let places = await getSavedPlaces();

        // Self-Healing: Check for places without 'city' field
        const placesToUpdate = places.filter(p => !p.city);

        if (placesToUpdate.length > 0) {
            await Promise.all(placesToUpdate.map(async (place) => {
                try {
                    const placeDetails = await fetchPlaceDetails(place.place_id);
                    if (placeDetails && placeDetails.city) {
                        await updateSavedPlace(place.place_id, { city: placeDetails.city });
                    }
                } catch (e) {
                    console.warn(`Failed to heal place ${place.name}`, e);
                }
            }));
            places = await getSavedPlaces();
        }

        // Group by City
        const groups: Record<string, SavedPlace[]> = {};
        places.forEach(place => {
            let city = 'Other';

            if (place.city) {
                city = place.city;
            } else if (place.vicinity) {
                // Fallback extraction
                const parts = place.vicinity.split(',');
                if (parts.length > 1) {
                    city = parts[parts.length - 1].trim().replace(/^[\d\s]+/, '');
                } else {
                    city = place.vicinity;
                }
            }

            if (!groups[city]) {
                groups[city] = [];
            }
            groups[city].push(place);
        });

        // Default to keeping the first city expanded if none selected
        const sortedCities = Object.keys(groups).sort();
        if (!expandedCity && sortedCities.length > 0) {
            setExpandedCity(sortedCities[0]);
        }

        const newSections = sortedCities.map(city => ({
            title: city,
            data: groups[city].sort((a, b) => b.savedAt - a.savedAt)
        }));

        setSections(newSections);
        setIsLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadPlaces();
        }, [])
    );

    const toggleSection = (city: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCity(expandedCity === city ? null : city);
    };

    const confirmDelete = (place: SavedPlace) => {
        Alert.alert(
            "Remove Place",
            `Remove "${place.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    onPress: async () => {
                        await removePlace(place.place_id);
                        loadPlaces();
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const confirmDeleteAll = () => {
        Alert.alert(
            "Delete All",
            "Are you sure you want to delete ALL saved places? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    onPress: async () => {
                        await removeAllPlaces();
                        setSections([]);
                        loadPlaces();
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handlePlacePress = (place: SavedPlace) => {
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

    const renderItem = ({ item: place, section }: { item: SavedPlace, section: Section }) => {
        if (section.title !== expandedCity) {
            return null;
        }

        const photoUrl = place.photos?.[0]?.name ? getPlacePhotoUrl(place.photos[0].name) : null;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}
                onPress={() => handlePlacePress(place)}
            >
                {/* Hero Image Section */}
                <View style={styles.heroContainer}>
                    {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.placeholderHero, { backgroundColor: theme.background }]}>
                            <Ionicons name="image-outline" size={48} color={theme.textLight} />
                        </View>
                    )}

                    {/* Floating Delete Button */}
                    <TouchableOpacity
                        onPress={() => confirmDelete(place)}
                        style={[styles.deleteButton, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Category Tag Overlay */}
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{place.types[0]?.replace('_', ' ')}</Text>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>{place.name}</Text>
                        {place.rating && (
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#FBC02D" />
                                <Text style={styles.ratingText}>{place.rating}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.placeAddress, { color: theme.textLight }]} numberOfLines={1}>
                        {place.vicinity}
                    </Text>

                    <View style={styles.footerRow}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {place.opening_hours?.open_now !== undefined && (
                                <Text style={[styles.statusText, { color: place.opening_hours.open_now ? '#00B894' : '#FF7675' }]}>
                                    {place.opening_hours.open_now ? 'Open' : 'Closed'}
                                </Text>
                            )}
                            {place.price_level && (
                                <Text style={{ color: theme.textLight }}>• {'$'.repeat(place.price_level)}</Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={theme.textLight} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
        const isExpanded = expandedCity === title;
        return (
            <TouchableOpacity
                style={[
                    styles.sectionHeaderContainer,
                    { backgroundColor: theme.background } // Transparent look merging with bg
                ]}
                onPress={() => toggleSection(title)}
                activeOpacity={0.7}
            >
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                <View style={[styles.expandIcon, isExpanded && { backgroundColor: theme.accent }]}>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={isExpanded ? "#fff" : theme.textLight}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>My Places</Text>
                    {sections.length > 0 && (
                        <TouchableOpacity onPress={confirmDeleteAll} style={styles.deleteAllButton}>
                            <Text style={styles.deleteAllText}>Delete All</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={[styles.headerSubtitle, { color: theme.textLight }]}>{sections.reduce((acc, s) => acc + s.data.length, 0)} places saved across {sections.length} cities</Text>
            </View>

            {sections.length === 0 && !isLoading && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-dislike-outline" size={64} color={theme.textLight} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>No saved places yet.</Text>
                    <Text style={[styles.emptySubText, { color: theme.textLight }]}>Go explore and save some!</Text>
                </View>
            )}

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.place_id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.list}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
            />
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
        marginBottom: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
    },
    deleteAllButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    deleteAllText: {
        color: '#FF4B4B',
        fontSize: 14,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    expandIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    card: {
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    heroContainer: {
        height: 140,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    placeholderHero: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#333',
    },
    cardContent: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    placeName: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F57F17',
    },
    placeAddress: {
        fontSize: 14,
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 16,
    }
});
