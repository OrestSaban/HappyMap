import { Text, View } from '@/components/Themed';
import { fetchPlaceDetails } from '@/services/places';
import { getSavedPlaces, removePlace, SavedPlace, updateSavedPlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, LayoutAnimation, Platform, SectionList, StyleSheet, TouchableOpacity, UIManager } from 'react-native';

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

    const loadPlaces = async () => {
        setIsLoading(true);
        let places = await getSavedPlaces();

        // Self-Healing: Check for places without 'city' field
        const placesToUpdate = places.filter(p => !p.city);

        if (placesToUpdate.length > 0) {
            console.log(`Self-healing ${placesToUpdate.length} places (missing city)...`);
            // Fetch checks in parallel
            await Promise.all(placesToUpdate.map(async (place) => {
                try {
                    const city = await fetchPlaceDetails(place.place_id);
                    if (city) {
                        place.city = city;
                        await updateSavedPlace(place);
                    }
                } catch (e) {
                    console.warn(`Failed to heal place ${place.name}`, e);
                }
            }));

            // Re-fetch to be safe, or just use modified 'places' array
            places = await getSavedPlaces();
        }

        // Group by City
        const groups: Record<string, SavedPlace[]> = {};
        places.forEach(place => {
            let city = 'Unknown Location';

            // Priority 0: Saved Canonical City (Self-Healed)
            if (place.city) {
                city = place.city;
            } else
                // Priority 1: Plus Code (Compound Code)
                // Format: "8FQQ+4X Prague - Prague 6, Czechia" -> We want "Prague"
                if (place.plus_code && place.plus_code.compound_code) {
                    const parts = place.plus_code.compound_code.split(' ');
                    if (parts.length > 1) {
                        // Remove the code (first part)
                        let addressPart = parts.slice(1).join(' '); // "Prague - Prague 6, Czechia"

                        // Remove country if present (usually last part after comma)
                        const commaParts = addressPart.split(',');
                        if (commaParts.length > 1) {
                            addressPart = commaParts[0].trim(); // "Prague - Prague 6"
                        }

                        // Remove sub-regions separated by " - "
                        const subRegionParts = addressPart.split(' - ');
                        if (subRegionParts.length > 0) {
                            city = subRegionParts[0].trim(); // "Prague"
                        } else {
                            city = addressPart;
                        }
                    }
                } else if (place.vicinity) {
                    // Priority 2: Vicinity Logic
                    // "Vinohradská 12, 120 00 Prague 2" -> We want "Prague"
                    const parts = place.vicinity.split(',');
                    if (parts.length > 1) {
                        let lastPart = parts[parts.length - 1].trim(); // "120 00 Prague 2"

                        // Attempt to remove Zip Codes (looks for leading digits)
                        // "120 00 Prague 2" -> "Prague 2"
                        // "Prague 2" is technically a district, but often used as City. 
                        // To be safe, just stripping numbers might be too aggressive if city name has numbers (rare).
                        // Let's strip purely numeric/space prefixes.
                        lastPart = lastPart.replace(/^[\d\s]+/, '');

                        // Also often cities have "Prague 1", "Prague 2". Ideally we group them all as "Prague".
                        // Heuristic: If it starts with "Prague", just use "Prague"?
                        // No, that's hardcoding.
                        // For now, let's just use the cleaner string.
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
            `Are you sure you want to remove "${place.name}" from your saved places?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
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
        // Only render if this section is expanded
        if (section.title !== expandedCity) {
            return null;
        }

        return (
            <View style={styles.card}>
                <TouchableOpacity style={styles.cardContent} onPress={() => handlePlacePress(place)}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress}>{place.vicinity}</Text>
                    <Text style={styles.placeType}>{place.types[0]}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => confirmDelete(place)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={24} color="#ff3b30" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
        const isExpanded = expandedCity === title;
        return (
            <TouchableOpacity
                style={styles.headerBackground}
                onPress={() => toggleSection(title)}
                activeOpacity={0.7}
            >
                <Text style={styles.sectionHeader}>{title}</Text>
                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#007AFF"
                />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>My Places</Text>

            {sections.length === 0 && !isLoading && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No saved places yet.</Text>
                    <Text style={styles.emptySubText}>Go explore and save some!</Text>
                </View>
            )}

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.place_id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.list}
                stickySectionHeadersEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 10,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerBackground: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        marginLeft: 8, // Indent items slightly
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardContent: {
        flex: 1,
    },
    placeName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    placeAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    placeType: {
        fontSize: 12,
        color: '#007AFF',
        textTransform: 'capitalize',
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#333',
        fontWeight: 'bold',
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    }
});
