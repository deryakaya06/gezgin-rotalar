import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

import { ProfileSummary } from '@/components/profile-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TileStripe } from '@/components/tile-stripe';
import { Button } from '@/components/ui/button';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { auth } from '@/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  function handleLogout() {
    // Yönlendirmeyi _layout'taki Stack.Protected yapar.
    signOut(auth);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TileStripe />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Profil</ThemedText>

          <ProfileSummary uid={user?.uid} profile={profile}>
            <ThemedText type="caption" themeColor="textSecondary">
              {user?.email}
            </ThemedText>
          </ProfileSummary>

          <Button title="Lider Tablosunu Gör" onPress={() => router.push('/leaderboard')} />
          <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
});
