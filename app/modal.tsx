import { Text, View } from '@/components/Themed';
import { openMapsApp } from '@/services/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

export default function ModalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

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
    <View style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      <View style={styles.content}>
        <Ionicons name="location" size={64} color="#007AFF" style={styles.icon} />
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>{vicinity}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={handleNavigate}>
            <Ionicons name="navigate-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.back()}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Close</Text>
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
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButtonText: {
    color: '#333',
  },
});
