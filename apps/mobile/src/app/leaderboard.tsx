import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { COLLECTIONS, type UserProfile, type WithId } from '@repo/shared';

import { FollowButton } from '@/components/follow-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0' };

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.uid ?? null;
  const [users, setUsers] = useState<WithId<UserProfile>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.users),
      orderBy('totalPoints', 'desc'),
      limit(20)
    );
    getDocs(q)
      .then((snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as WithId<UserProfile>[];
        setUsers(items);
      })
      .catch((error) => {
        console.log('Liderlik tablosu hatasi:', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={styles.backText}>{'< Geri'}</ThemedText>
          </Pressable>
        </View>

        <ThemedText type="title" style={styles.title}>
          Lider Tablosu
        </ThemedText>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const isMe = item.id === currentUserId;
            return (
              <Pressable
                style={[styles.row, isMe && styles.rowHighlight]}
                onPress={() =>
                  isMe
                    ? router.navigate('/(tabs)/profile')
                    : router.push({ pathname: '/user/[id]', params: { id: item.id } })
                }
              >
                <ThemedText type="defaultSemiBold" style={styles.rank}>
                  #{index + 1}
                </ThemedText>
                <View style={styles.rowContent}>
                  <ThemedText type="defaultSemiBold">
                    {item.displayName} {isMe ? '(Sen)' : ''}
                  </ThemedText>
                  <ThemedText style={styles.rowSubtitle}>
                    {item.accountType === 'couple' ? 'Çift Hesabı' : 'Arkadaş Hesabı'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.points}>{item.totalPoints} puan</ThemedText>
                <FollowButton userId={item.id} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {loading ? 'Yükleniyor...' : 'Henüz kimse puan kazanmamış.'}
            </ThemedText>
          }
        />
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
  },
  headerRow: { marginBottom: Spacing.two },
  backText: { color: COLORS.primary, fontWeight: '600' },
  title: { marginBottom: Spacing.three },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  row: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    gap: 8,
  },
  rowHighlight: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#FFF1EC',
  },
  rank: { width: 32 },
  rowContent: { flex: 1 },
  rowSubtitle: { fontSize: 11, color: '#94A3B8' },
  points: { fontWeight: '700', color: COLORS.primary },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: Spacing.four },
});