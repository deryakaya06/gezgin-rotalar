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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0' };

type FeedItem = CheckIn & {
  id: string;
  displayName: string;
  accountType: UserProfile['accountType'];
};

export default function HomeScreen() {
  const [mode, setMode] = useState<'kesfet' | 'takip'>('kesfet');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    loadFeed();
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
        console.log('Takip listesi alinamadi:', error.message);
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

  function loadFeed() {
    const q = query(
      collection(db, COLLECTIONS.checkIns),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    getDocs(q)
      .then(async (snapshot) => {
        const rawItems = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as CheckIn),
        }));

        const uniqueUserIds = Array.from(
          new Set(rawItems.map((item) => item.userId))
        );

        const userDocs = await Promise.all(
          uniqueUserIds.map((uid) => getDoc(doc(db, COLLECTIONS.users, uid)))
        );

        const userMap: Record<string, Partial<UserProfile> | null> = {};
        userDocs.forEach((userSnap, index) => {
          userMap[uniqueUserIds[index]] = userSnap.exists()
            ? (userSnap.data() as Partial<UserProfile>)
            : null;
        });

        const combined: FeedItem[] = rawItems.map((item) => ({
          ...item,
          displayName: userMap[item.userId]?.displayName ?? 'Bir Gezgin',
          accountType: userMap[item.userId]?.accountType ?? 'friends',
        }));
        setAllFeedItems(combined);
      })
      .catch((error) => {
        console.log('Akis yuklenemedi:', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function formatDate(timestamp: CheckIn['createdAt']) {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('tr-TR');
  }

  const displayedItems =
    mode === 'kesfet'
      ? allFeedItems
      : allFeedItems.filter((item) => followingIds.includes(item.userId));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <View style={styles.headerRow}>
                <View>
                  <ThemedText type="title">Gezgin Rotalar</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>FEED</ThemedText>
                </View>
              </View>

              <View style={styles.tabRow}>
                <Pressable
                  onPress={() => setMode('kesfet')}
                  style={[
                    styles.tabButton,
                    mode === 'kesfet' && styles.tabButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      mode === 'kesfet' && styles.tabTextActive,
                    ]}
                  >
                    Kesfet
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setMode('takip')}
                  style={[
                    styles.tabButton,
                    mode === 'takip' && styles.tabButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      mode === 'takip' && styles.tabTextActive,
                    ]}
                  >
                    Takip Edilenler
                  </ThemedText>
                </Pressable>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Pressable style={styles.postHeaderRow} onPress={() => openProfile(item.userId)}>
                <View style={styles.postAvatar} />
                <View style={styles.postHeaderText}>
                  <ThemedText type="defaultSemiBold">{item.displayName}</ThemedText>
                  <ThemedText style={styles.postMeta}>
                    {item.accountType === 'couple' ? 'Çift' : 'Arkadaş Grubu'} -{' '}
                    {formatDate(item.createdAt)}
                  </ThemedText>
                </View>
              </Pressable>

              <View style={styles.locationBadge}>
                <ThemedText style={styles.locationBadgeText}>
                  {item.locationName}
                </ThemedText>
              </View>

              {item.note ? (
                <ThemedText style={styles.postCaption}>{item.note}</ThemedText>
              ) : null}

              {item.points ? (
                <View style={styles.pointsTag}>
                  <ThemedText style={styles.pointsTagText}>
                    +{item.points} puan
                  </ThemedText>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {loading
                ? 'Yukleniyor...'
                : mode === 'takip'
                ? 'Henuz kimseyi takip etmiyorsun. Lider Tablosu uzerinden birilerini takip edebilirsin.'
                : 'Henuz kimse check-in yapmamis. Ilk check-ini sen yap!'}
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
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.three },
  tabButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 13 },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  postCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 8,
  },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
  },
  postHeaderText: { flex: 1 },
  postMeta: { fontSize: 11, color: '#94A3B8' },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  locationBadgeText: { fontSize: 13, color: '#0D9488', fontWeight: '600' },
  postCaption: { fontSize: 13, lineHeight: 18 },
  pointsTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1EC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pointsTagText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: Spacing.four },
});