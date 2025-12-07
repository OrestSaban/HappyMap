import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { openMapsApp } from '@/services/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to construct V1 Photo URL
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const getPhotoUrl = (photoName?: string) => {
  if (!photoName || !GOOGLE_API_KEY) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_API_KEY}`;
};

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const placeId = params.place_id as string;
  const initialName = params.name as string;

  useEffect(() => {
    const loadDetails = async () => {
      if (!placeId) return;
      try {
        // Fetch precise details using V1 API with English language
        const url = `https://places.googleapis.com/v1/places/${placeId}`;
        const response = await fetch(`${url}?fields=id,displayName,formattedAddress,location,types,rating,userRatingCount,priceLevel,regularOpeningHours,photos,editorialSummary&languageCode=en&key=${GOOGLE_API_KEY}`);
        const data = await response.json();

        setDetails(data);
      } catch (e) {
        console.error("Failed to load details", e);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [placeId]);


  const lat = parseFloat(params.lat as string);
  const lng = parseFloat(params.lng as string);

  const handleNavigate = () => {
    openMapsApp(lat, lng, initialName);
  };

  const openNow = details?.regularOpeningHours?.openNow;
  const photos = details?.photos?.slice(0, 3) || [];
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = (event: any) => {
    const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  // Map Price
  let priceStr = '';
  if (details?.priceLevel) {
    const p = details.priceLevel;
    if (p === 'PRICE_LEVEL_INEXPENSIVE') priceStr = '$';
    if (p === 'PRICE_LEVEL_MODERATE') priceStr = '$$';
    if (p === 'PRICE_LEVEL_EXPENSIVE') priceStr = '$$$';
    if (p === 'PRICE_LEVEL_VERY_EXPENSIVE') priceStr = '$$$$';
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      {/* Hero Image Carousel */}
      <View style={styles.imageContainer}>
        {photos.length > 0 ? (
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
          <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.heroPlaceholder}>
            <Ionicons name="image-outline" size={64} color="#fff" />
          </LinearGradient>
        )}

        {/* Pagination Dots */}
        {photos.length > 1 && (
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

        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Title & Metadata */}
            <Text style={[styles.title, { color: theme.text }]}>{details?.displayName?.text || initialName}</Text>
            <Text style={[styles.address, { color: theme.textLight }]}>{details?.formattedAddress || params.vicinity}</Text>

            {/* Chips Row */}
            <View style={styles.chipsRow}>
              {details?.rating && (
                <View style={[styles.chip, { backgroundColor: '#FFF9C4' }]}>
                  <Ionicons name="star" size={14} color="#FBC02D" />
                  <Text style={[styles.chipText, { color: '#F57F17' }]}>{details.rating} ({details.userRatingCount})</Text>
                </View>
              )}

              {priceStr ? (
                <View style={[styles.chip, { backgroundColor: '#E0F2F1' }]}>
                  <Text style={[styles.chipText, { color: '#00897B' }]}>{priceStr}</Text>
                </View>
              ) : null}

              {details?.regularOpeningHours && (
                <View style={[styles.chip, openNow ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFEBEE' }]}>
                  <Text style={[styles.chipText, openNow ? { color: '#2E7D32' } : { color: '#C62828' }]}>
                    {openNow ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Description */}
            {details?.editorialSummary?.text && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
                <Text style={[styles.bodyText, { color: theme.textLight }]}>{details.editorialSummary.text}</Text>
              </View>
            )}

            {/* Opening Hours */}
            {details?.regularOpeningHours?.weekdayDescriptions && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Hours</Text>
                {details.regularOpeningHours.weekdayDescriptions.map((day: string, idx: number) => (
                  <Text key={idx} style={[styles.hourRow, { color: theme.textLight }]}>{day}</Text>
                ))}
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Fixed Footer */}
        <View style={[styles.footer, { borderTopColor: theme.textLight + '20', backgroundColor: theme.background }]}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleNavigate} style={{ flex: 1 }}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.navigateButton}
            >
              <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.navigateText}>Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
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
  pagination: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
    height: 6,
    borderRadius: 3,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    marginTop: -30, // Overlap effect
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontWeight: '700',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hourRow: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  toiletHeader: {
    height: 200,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toiletHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 12,
  },
  closeButtonDark: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 4,
  },
  toiletOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  toiletBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  toiletHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  toiletContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  toiletTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  toiletAddress: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  toiletSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  toiletCloseBtn: {
    padding: 4,
  },
  toiletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 4,
  },
  toiletChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
});
