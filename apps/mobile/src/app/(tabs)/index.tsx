import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type CheckIn, type UserProfile } from '@repo/shared';

import { CheckInPhoto } from '@/components/check-in-photo';
import { LikeButton } from '@/components/like-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TileStripe } from '@/components/tile-stripe';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Tag } from '@/components/ui/tag';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

type FeedItem = CheckIn & {
  id: string;
  displayName: string;
  accountType: UserProfile['accountType'];
};

const FEED_SIZE = 30;
/** Firestore 'in' sorgusu en fazla 30 değer kabul eder. */
const IN_QUERY_LIMIT = 30;

type FeedMode = 'kesfet' | 'takip';

/** Keşfet: herkesin son check-in'leri. Takip: yalnızca takip edilenlerin check-in'leri. */
async function fetchCheckIns(mode: FeedMode, followingIds: string[]) {
  const checkIns = collection(db, COLLECTIONS.checkIns);
  if (mode === 'kesfet') {
    const snapshot = await getDocs(query(checkIns, orderBy('createdAt', 'desc'), limit(FEED_SIZE)));
    return snapshot.docs;
  }

  const chunks: string[][] = [];
  for (let i = 0; i < followingIds.length; i += IN_QUERY_LIMIT) {
    chunks.push(followingIds.slice(i, i + IN_QUERY_LIMIT));
  }
  const snapshots = await Promise.all(
    chunks.map((ids) =>
      getDocs(
        query(checkIns, where('userId', 'in', ids), orderBy('createdAt', 'desc'), limit(FEED_SIZE))
      )
    )
  );
  return snapshots
    .flatMap((s) => s.docs)
    .sort((a, b) => (b.get('createdAt')?.toMillis() ?? 0) - (a.get('createdAt')?.toMillis() ?? 0))
    .slice(0, FEED_SIZE);
}

/** Check-in'leri ve paylaşanların görünen adlarını getirir. */
async function fetchFeed(mode: FeedMode, followingIds: string[]): Promise<FeedItem[]> {
  const docs = await fetchCheckIns(mode, followingIds);
  const rawItems = docs.map((docItem) => ({
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
  const [mode, setMode] = useState<FeedMode>('kesfet');
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  // Takip listesi yalnızca "Takip Edilenler" sekmesinin sorgusunu etkiler.
  const followingKey = mode === 'takip' ? followingIds?.join(',') : 'kesfet';

  const load = useCallback(
    (signal: { cancelled: boolean }, pull = false) => {
      if (!user || followingIds === null) return;
      if (pull) setRefreshing(true);
      fetchFeed(mode, followingIds)
        .then((next) => {
          if (!signal.cancelled) setItems(next);
        })
        .catch((error) => {
          console.log('Akış yüklenemedi:', error.message);
        })
        .finally(() => {
          if (signal.cancelled) return;
          setLoading(false);
          setRefreshing(false);
        });
    },
    // followingKey, followingIds dizisinin içeriği değiştiğinde yeniden yüklemek için.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, mode, followingKey]
  );

  // Sekmeye her dönüldüğünde (ör. check-in yaptıktan sonra) akış yenilenir.
  useFocusEffect(
    useCallback(() => {
      const signal = { cancelled: false };
      load(signal);
      return () => {
        signal.cancelled = true;
      };
    }, [load])
  );

  function selectMode(next: FeedMode) {
    if (next === mode) return;
    setItems([]);
    setLoading(true);
    setMode(next);
  }

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
        setFollowingIds([]);
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TileStripe inset={Spacing.four} />
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ cancelled: false }, true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListHeaderComponent={
            <>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <ThemedText type="subtitle">Gezgin Rotalar</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.headerSubtitle}>
                    AKIŞ
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => router.push('/search')}
                  accessibilityRole="button"
                  accessibilityLabel="Gezgin ara"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.searchButton,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="search" size={20} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.tabRow}>
                <Chip label="Keşfet" selected={mode === 'kesfet'} onPress={() => selectMode('kesfet')} />
                <Chip
                  label="Takip Edilenler"
                  selected={mode === 'takip'}
                  onPress={() => selectMode('takip')}
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

              <View style={styles.postFooter}>
                <LikeButton checkInId={item.id} initialCount={item.likeCount ?? 0} />
                {item.points ? <Tag label={`+${item.points} puan`} /> : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              {loading
                ? 'Yükleniyor...'
                : mode === 'takip'
                  ? followingIds?.length
                    ? 'Takip ettiğin kişiler henüz check-in yapmamış.'
                    : 'Henüz kimseyi takip etmiyorsun. Lider tablosundan birilerini takip edebilirsin.'
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
    ...ContentColumn,
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  headerText: { flex: 1 },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  headerSubtitle: { letterSpacing: 1 },
  tabRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  postCard: { gap: Spacing.two },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postHeaderText: { flex: 1 },
  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
