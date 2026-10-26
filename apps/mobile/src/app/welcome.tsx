import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.centered}>
          Hoş geldin{profile ? `, ${profile.displayName}` : ''}! 🎉
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centered}>
          {"Gezgin Rotalar'a başarıyla katıldın. Maceraya hazır mısın?"}
        </ThemedText>

        <Button
          style={styles.button}
          title="Keşfetmeye Başla"
          onPress={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    ...ContentColumn,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centered: { textAlign: 'center' },
  button: { marginTop: Spacing.four, alignSelf: 'stretch' },
});
