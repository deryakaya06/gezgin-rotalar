import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { COLLECTIONS, type CheckIn, type UserProfile } from '@repo/shared';

import { CheckInPhoto } from '@/components/check-in-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TileStripe } from '@/components/tile-stripe';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Tag } from '@/components/ui/tag';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

type FeedItem = CheckIn & {
  id: string;
  displayName: string;
  accountType: UserProfile['accountType'];
};

/** Son 30 check-in'i ve paylaşanların görünen adlarını getirir. */
async function fetchFeed(): Promise<FeedItem[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.checkIns), orderBy('createdAt', 'desc'), limit(30))
  );
  const rawItems = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as CheckIn),
  }));

  const uniqueUserIds = Array.from(new Set(rawItems.map((item) => item.userId)));
  const userDocs = await Promise.all(
    uniqueUserIds.map((uid) => getDoc(doc(db, COLLECTIONS.users, uid)))
  );
  const userMap: Record<string, Partial<UserProfile> | undefined> = {};
  userDocs.forEach((userSnap, index) => {
    userMap[uniqueUserIds[index]] = userSnap.data() as Partial<UserProfile> | undefined;
  });

  return rawItems.map((item) => ({
    ...item,
    displayName: userMap[item.userId]?.displayName ?? 'Bir Gezgin',
    accountType: userMap[item.userId]?.accountType ?? 'friends',
  }));
}

export default function HomeScreen() {
  const [mode, setMode] = useState<'kesfet' | 'takip'>('kesfet');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchFeed()
      .then((items) => {
        if (!cancelled) setAllFeedItems(items);
      })
      .catch((error) => {
        console.log('Akış yüklenemedi:', error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Başka ekranda takip edilen/bırakılan kullanıcılar "Takip Edilenler" sekmesine hemen yansısın.
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      collection(db, COLLECTIONS.users, user.uid, 'following'),
      (snapshot) => {
        setFollowingIds(snapshot.docs.map((docItem) => docItem.id));
      },
      (error) => {
        console.log('Takip listesi alınamadı:', error.message);
      }
    );
  }, [user]);

  function openProfile(userId: string) {
    if (userId === user?.uid) {
      router.navigate('/(tabs)/profile');
    } else {
      router.push({ pathname: '/user/[id]', params: { id: userId } });
    }
  }

  const displayedItems =
    mode === 'kesfet'
      ? allFeedItems
      : allFeedItems.filter((item) => followingIds.includes(item.userId));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TileStripe inset={Spacing.four} />
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <View style={styles.headerRow}>
                <ThemedText type="subtitle">Gezgin Rotalar</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.headerSubtitle}>
                  AKIŞ
                </ThemedText>
              </View>

              <View style={styles.tabRow}>
                <Chip label="Keşfet" selected={mode === 'kesfet'} onPress={() => setMode('kesfet')} />
                <Chip
                  label="Takip Edilenler"
                  selected={mode === 'takip'}
                  onPress={() => setMode('takip')}
                />
              </View>
            </>
          }
          renderItem={({ item }) => (
            <Card style={styles.postCard}>
              <Pressable style={styles.postHeaderRow} onPress={() => openProfile(item.userId)}>
                <View style={[styles.postAvatar, { backgroundColor: theme.highlight }]} />
                <View style={styles.postHeaderText}>
                  <ThemedText type="defaultSemiBold">{item.displayName}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {item.accountType === 'couple' ? 'Çift' : 'Arkadaş Grubu'} ·{' '}
                    {formatDate(item.createdAt)}
                  </ThemedText>
                </View>
              </Pressable>

              <Tag label={item.locationName} tone="accent" />

              {item.photoUrl ? <CheckInPhoto url={item.photoUrl} /> : null}

              {item.note ? <ThemedText type="small">{item.note}</ThemedText> : null}

              {item.points ? <Tag label={`+${item.points} puan`} /> : null}
            </Card>
          )}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              {loading
                ? 'Yükleniyor...'
                : mode === 'takip'
                  ? 'Takip ettiğin kimsenin check-in\'i yok. Lider tablosundan birilerini takip edebilirsin.'
                  : 'Henüz kimse check-in yapmamış. İlk check-in\'i sen yap!'}
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
  headerRow: { marginBottom: Spacing.three },
  headerSubtitle: { letterSpacing: 1 },
  tabRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  postCard: { gap: Spacing.two },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postHeaderText: { flex: 1 },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
