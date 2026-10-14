import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { COLLECTIONS, type UserProfile, type WithId } from '@repo/shared';

import { FollowButton } from '@/components/follow-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { ContentColumn, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';

export default function LeaderboardScreen() {
  const router = useRouter();
  const theme = useTheme();
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
        console.log('Lider tablosu yüklenemedi:', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackButton />

        <ThemedText type="subtitle" style={styles.title}>
          Lider Tablosu
        </ThemedText>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const isMe = item.id === currentUserId;
            // Profili açan alan ile takip butonu kardeş öğeler: web'de düğme içinde düğme olamaz.
            return (
              <View
                style={[
                  styles.row,
                  isMe
                    ? { borderColor: theme.primary, backgroundColor: theme.primarySoft, borderWidth: 2 }
                    : { borderColor: theme.border },
                ]}
              >
                <Pressable
                  style={({ pressed }) => [styles.main, pressed && styles.pressed]}
                  onPress={() =>
                    isMe
                      ? router.navigate('/(tabs)/profile')
                      : router.push({ pathname: '/user/[id]', params: { id: item.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}. sıra, ${item.displayName}, ${item.totalPoints} puan`}
                >
                  <ThemedText type="defaultSemiBold" style={styles.rank}>
                    #{index + 1}
                  </ThemedText>
                  <View style={styles.rowContent}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {item.displayName} {isMe ? '(Sen)' : ''}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {item.accountType === 'couple' ? 'Çift Hesabı' : 'Arkadaş Hesabı'}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    {item.totalPoints} puan
                  </ThemedText>
                </Pressable>
                <FollowButton userId={item.id} />
              </View>
            );
          }}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
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
    ...ContentColumn,
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  title: { marginBottom: Spacing.two },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  pressed: { opacity: 0.7 },
  rank: { width: 36 },
  rowContent: { flex: 1 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
