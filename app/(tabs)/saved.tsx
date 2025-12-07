import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchPlaceDetails, getPlacePhotoUrl } from '@/services/places';
import { getSavedPlaces, removePlace, SavedPlace, updateSavedPlace } from '@/services/storage';
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
            let city = 'Unknown Location';

            if (place.city) {
                city = place.city;
            } else if (place.plus_code && place.plus_code.compound_code) {
                const parts = place.plus_code.compound_code.split(' ');
                if (parts.length > 1) {
                    let addressPart = parts.slice(1).join(' ');
                    const commaParts = addressPart.split(',');
                    if (commaParts.length > 1) {
                        addressPart = commaParts[0].trim();
                    }
                    const subRegionParts = addressPart.split(' - ');
                    if (subRegionParts.length > 0) {
                        city = subRegionParts[0].trim();
                    } else {
                        city = addressPart;
                    }
                }
            } else if (place.vicinity) {
                const parts = place.vicinity.split(',');
                if (parts.length > 1) {
                    let lastPart = parts[parts.length - 1].trim();
                    lastPart = lastPart.replace(/^[\d\s]+/, '');
                    city = lastPart;
                } else {
                    city = place.vicinity;
                }
            }

            if (!groups[city]) {
                groups[city] = [];
            }
            groups[city].push(place);
        });

        const newSections = Object.keys(groups).sort().map(city => ({
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
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                <TouchableOpacity style={styles.cardContent} onPress={() => handlePlacePress(place)}>
                    {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.placeInfoImage} />
                    ) : (
                        <View style={[styles.placeIcon, { backgroundColor: theme.background }]}>
                            <Ionicons name="location" size={24} color={theme.accent} />
                        </View>
                    )}
                    <View style={styles.placeInfo}>
                        <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>{place.name}</Text>
                        <Text style={[styles.placeAddress, { color: theme.textLight }]} numberOfLines={1}>{place.vicinity}</Text>
                        <Text style={[styles.placeType, { color: theme.primary }]}>{place.types[0]?.replace('_', ' ')}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => confirmDelete(place)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={24} color={theme.danger} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
        const isExpanded = expandedCity === title;
        return (
            <TouchableOpacity
                style={[
                    styles.headerBackground,
                    { backgroundColor: theme.card, shadowColor: theme.text },
                    isExpanded && { backgroundColor: theme.primary }
                ]}
                onPress={() => toggleSection(title)}
                activeOpacity={0.7}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="map-outline" size={20} color={isExpanded ? '#fff' : theme.accent} style={{ marginRight: 10 }} />
                    <Text style={[styles.sectionHeader, { color: isExpanded ? '#fff' : theme.text }]}>{title}</Text>
                </View>
                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={isExpanded ? '#fff' : theme.textLight}
                />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>My Places</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textLight }]}>{sections.length} Cities Saved</Text>
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
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerBackground: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 10,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        marginLeft: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    placeIcon: {
        width: 50,
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    placeInfoImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#333'
    },
    placeInfo: {
        flex: 1,
    },
    placeName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    placeAddress: {
        fontSize: 13,
        marginBottom: 2,
    },
    placeType: {
        fontSize: 11,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    deleteButton: {
        padding: 8,
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
