import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { openMapsApp } from '@/services/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ToiletModalScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const name = params.name as string;
    const vicinity = params.vicinity as string;
    const distance = params.distance as string | undefined;
    const lat = parseFloat(params.lat as string);
    const lng = parseFloat(params.lng as string);

    const handleNavigate = () => {
        openMapsApp(lat, lng, name);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom + 20 }]}>
            {/* Content */}
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="water" size={40} color="#2196F3" />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>{name}</Text>
                <Text style={[styles.address, { color: theme.textLight }]}>{vicinity}</Text>

                {/* Distance chip */}
                {distance && (
                    <View style={styles.chip}>
                        <Ionicons name="location-outline" size={14} color="#2196F3" />
                        <Text style={styles.chipText}>{distance}</Text>
                    </View>
                )}
            </View>

            {/* Navigate Button */}
            <View style={styles.footer}>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    address: {
        fontSize: 15,
        marginTop: 6,
        textAlign: 'center',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        marginTop: 16,
        gap: 4,
    },
    chipText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2196F3',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
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
});
