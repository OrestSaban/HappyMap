import Colors from '@/constants/Colors';
import { openMapsApp } from '@/services/navigation';
import { SavedPlace } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface PlaceDetailCardRef {
    close: () => void;
}

interface PlaceDetailCardProps {
    place: SavedPlace;
    onClose: () => void;
    theme: typeof Colors.light;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

// Helper to construct V1 Photo URL
const getPhotoUrl = (photoName?: string) => {
    if (!photoName || !GOOGLE_API_KEY) return undefined;
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_API_KEY}`;
};

const PlaceDetailCard = forwardRef<PlaceDetailCardRef, PlaceDetailCardProps>(({ place, onClose, theme }, ref) => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSlide, setActiveSlide] = useState(0);

    const handleClose = () => {
        translateY.value = withTiming(SCREEN_HEIGHT, {
            duration: 250,
            easing: Easing.in(Easing.cubic),
        }, (finished) => {
        });
        // Wait for animation to finish before unmounting
        setTimeout(onClose, 250);
    };

    useImperativeHandle(ref, () => ({
        close: handleClose
    }));

    useEffect(() => {
        // Animate In: Fast Slide Up (No Spring/Bounce)
        translateY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });

        const loadDetails = async () => {
            setDetails(place);
            try {
                const url = `https://places.googleapis.com/v1/places/${place.place_id}`;
                const response = await fetch(`${url}?fields=id,displayName,formattedAddress,location,types,rating,userRatingCount,priceLevel,regularOpeningHours,photos,editorialSummary&languageCode=en&key=${GOOGLE_API_KEY}`);
                const data = await response.json();
                setDetails(data);
            } catch (e) {
                console.error("Failed to refresh details", e);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [place.place_id]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const handleNavigate = () => {
        const lat = details?.location?.lat || place.geometry.location.lat;
        const lng = details?.location?.lng || place.geometry.location.lng;
        const name = details?.displayName?.text || place.name;
        openMapsApp(lat, lng, name);
    };

    const handleScroll = (event: any) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
        if (slide !== activeSlide) setActiveSlide(slide);
    };

    const photos = details?.photos?.slice(0, 3) || place.photos?.slice(0, 3) || [];
    const openNow = details?.regularOpeningHours?.openNow ?? place.opening_hours?.open_now;
    const rating = details?.rating ?? place.rating;
    const userRatingCount = details?.userRatingCount ?? place.user_ratings_total;

    let priceStr = '';
    if (details?.priceLevel) {
        const p = details.priceLevel;
        if (p === 'PRICE_LEVEL_INEXPENSIVE') priceStr = '$';
        if (p === 'PRICE_LEVEL_MODERATE') priceStr = '$$';
        if (p === 'PRICE_LEVEL_EXPENSIVE') priceStr = '$$$';
        if (p === 'PRICE_LEVEL_VERY_EXPENSIVE') priceStr = '$$$$';
    } else if (place.price_level) {
        priceStr = '$'.repeat(place.price_level);
    }

    const isToilet = place.types?.includes('toilet') || place.types?.includes('restroom');

    return (
        <Animated.View style={[styles.container, { backgroundColor: theme.background }, animatedStyle]}>
            {/* Photo Section */}
            <View style={styles.imageContainer}>
                {photos.length > 0 && !isToilet ? (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        style={styles.scrollView}
                    >
                        {photos.map((photo: any, index: number) => (
                            <Image
                                key={index}
                                source={{ uri: getPhotoUrl(photo.name) }}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={[styles.heroPlaceholder, { backgroundColor: isToilet ? '#E3F2FD' : theme.card }]}>
                        <Ionicons
                            name={isToilet ? "water" : "image-outline"}
                            size={48}
                            color={isToilet ? "#2196F3" : theme.textLight}
                        />
                    </View>
                )}

                {photos.length > 1 && !isToilet && (
                    <View style={styles.pagination}>
                        {photos.map((_: any, index: number) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === activeSlide ? styles.activeDot : styles.inactiveDot
                                ]}
                            />
                        ))}
                    </View>
                )}

                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Content Body */}
            <View style={styles.contentBody}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                    {details?.displayName?.text || place.name}
                </Text>
                <Text style={[styles.address, { color: theme.textLight }]} numberOfLines={1}>
                    {details?.formattedAddress || place.vicinity}
                </Text>

                <View style={styles.chipsRow}>
                    {rating && (
                        <View style={[styles.chip, { backgroundColor: '#FFF9C4' }]}>
                            <Ionicons name="star" size={14} color="#FBC02D" />
                            <Text style={[styles.chipText, { color: '#F57F17' }]}>{rating} ({userRatingCount})</Text>
                        </View>
                    )}
                    {priceStr ? (
                        <View style={[styles.chip, { backgroundColor: '#E0F2F1' }]}>
                            <Text style={[styles.chipText, { color: '#00897B' }]}>{priceStr}</Text>
                        </View>
                    ) : null}
                    {openNow !== undefined && (
                        <View style={[styles.chip, openNow ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFEBEE' }]}>
                            <Text style={[styles.chipText, openNow ? { color: '#2E7D32' } : { color: '#C62828' }]}>
                                {openNow ? 'Open Now' : 'Closed'}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity activeOpacity={0.8} onPress={handleNavigate} style={{ marginTop: 10 }}>
                    <LinearGradient
                        colors={[theme.primary, theme.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.navigateButton}
                    >
                        <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.navigateText}>Navigate</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: -100, // Extend below screen
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 20,
        zIndex: 100,
        maxHeight: SCREEN_HEIGHT * 0.7,
        paddingBottom: 100, // Balance the negative bottom
    },
    imageContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    scrollView: {
        width: '100%',
        height: '100%',
    },
    heroImage: {
        width: SCREEN_WIDTH,
        height: '100%',
    },
    heroPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pagination: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 16,
        height: 6,
        borderRadius: 3,
    },
    inactiveDot: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 16,
        padding: 6,
    },
    contentBody: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        marginBottom: 16,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    chipText: {
        fontWeight: '700',
        fontSize: 12,
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
    },
    navigateText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default PlaceDetailCard;
