import { useEffect, useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0' };

const BADGES = [
  { id: 'first', emoji: '🌱', label: 'İlk Adım', min: 1 },
  { id: 'explorer', emoji: '🧭', label: 'Kaşif', min: 5 },
  { id: 'master', emoji: '🏆', label: 'Rota Ustası', min: 10 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [checkInCount, setCheckInCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then((snapshot) => {
          if (snapshot.exists()) setUserData(snapshot.data());
        });

        const q = query(collection(db, 'check_ins'), where('userId', '==', user.uid));
        getDocs(q)
          .then((snapshot) => {
            setCheckInCount(snapshot.size);
          })
          .catch((error) => {
            console.log('Check-in sayisi alinamadi:', error.message);
          });
      }
    });
    return () => unsubscribe();
  }, []);

  const earnedBadges = BADGES.filter((b) => checkInCount >= b.min);

  function handleLogout() {
    signOut(auth).then(() => {
      router.replace('/login');
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Profil</ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.avatarEmoji}>
            {userData?.accountType === 'couple' ? '💑' : '👥'}
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            {userData?.email ?? 'Yükleniyor...'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {userData?.accountType === 'couple' ? 'Çift Hesabı' : 'Arkadaş Hesabı'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsRow}>
          <ThemedView style={styles.statBox}>
            <ThemedText type="title" style={styles.statNumber}>
              {userData?.points ?? 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Toplam Puan</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statBox}>
            <ThemedText type="title" style={styles.statNumber}>
              {checkInCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Check-in</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statBox}>
            <ThemedText type="title" style={styles.statNumber}>
              {earnedBadges.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Rozet</ThemedText>
          </ThemedView>
        </ThemedView>

        {earnedBadges.length > 0 && (
          <ThemedView style={styles.badgeRow}>
            {earnedBadges.map((b) => (
              <ThemedView key={b.id} style={styles.badgeItem}>
                <ThemedText style={styles.badgeEmoji}>{b.emoji}</ThemedText>
                <ThemedText style={styles.badgeLabel}>{b.label}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        <Pressable style={styles.leaderboardButton} onPress={() => router.push('/leaderboard')}>
          <ThemedText style={styles.leaderboardButtonText}>Lider Tablosunu Gor</ThemedText>
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
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 4,
  },
  avatarEmoji: { fontSize: 40, marginBottom: 8 },
  subtitle: { color: '#94A3B8' },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20 },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  badgeRow: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  badgeItem: { alignItems: 'center', gap: 2 },
  badgeEmoji: { fontSize: 28 },
  badgeLabel: { fontSize: 11, color: '#94A3B8' },
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