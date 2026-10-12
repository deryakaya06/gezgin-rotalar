import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

const COLORS = { primary: '#FF5733' };

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Hoş geldin{profile ? `, ${profile.displayName}` : ''}! 🎉
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Gezgin Rotalar'a başarıyla katıldın. Maceraya hazır mısın?
        </ThemedText>

        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <ThemedText style={styles.buttonText}>Keşfetmeye Başla</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.four,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
