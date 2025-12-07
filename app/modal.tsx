import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { openMapsApp } from '@/services/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

export default function ModalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Parse params
  const name = params.name as string;
  const vicinity = params.vicinity as string;
  const place_id = params.place_id as string;
  const lat = parseFloat(params.lat as string);
  const lng = parseFloat(params.lng as string);

  const handleNavigate = () => {
    openMapsApp(lat, lng, name);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="location" size={48} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.subtitle, { color: theme.textLight }]}>{vicinity}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.touchableButton, { shadowColor: theme.primary }]}
            onPress={handleNavigate}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="navigate-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.textLight }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Close</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 50,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  touchableButton: {
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
