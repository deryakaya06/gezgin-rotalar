import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0' };

type UserRow = {
  id: string;
  email: string;
  points: number;
  accountType: string;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(20));
    getDocs(q)
      .then((snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as UserRow[];
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
              <View style={[styles.row, isMe && styles.rowHighlight]}>
                <ThemedText type="defaultSemiBold" style={styles.rank}>
                  #{index + 1}
                </ThemedText>
                <View style={styles.rowContent}>
                  <ThemedText type="defaultSemiBold">
                    {item.email} {isMe ? '(Sen)' : ''}
                  </ThemedText>
                  <ThemedText style={styles.rowSubtitle}>
                    {item.accountType === 'couple' ? 'Cift Hesabi' : 'Arkadas Hesabi'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.points}>{item.points} puan</ThemedText>
              </View>
            );
          }}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {loading ? 'Yukleniyor...' : 'Henuz kimse puan kazanmamis.'}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
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