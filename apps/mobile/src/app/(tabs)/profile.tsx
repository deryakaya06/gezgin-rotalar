import { StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

import { ProfileSummary } from '@/components/profile-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { auth } from '@/firebase';

const COLORS = { primary: '#FF5733' };

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
        <ThemedText type="title">Profil</ThemedText>

        <ProfileSummary uid={user?.uid} profile={profile}>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </ProfileSummary>

        <Pressable style={styles.leaderboardButton} onPress={() => router.push('/leaderboard')}>
          <ThemedText style={styles.leaderboardButtonText}>Lider Tablosunu Gör</ThemedText>
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Çıkış Yap</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  email: { fontSize: 12, color: '#94A3B8' },
  leaderboardButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  leaderboardButtonText: { color: '#fff', fontWeight: '700' },
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.four,
  },
  logoutText: { color: COLORS.primary, fontWeight: '700' },
});
