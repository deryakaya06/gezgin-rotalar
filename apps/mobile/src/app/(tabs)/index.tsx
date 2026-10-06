import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, db } from '@/firebase';

const COLORS = {
  primary: '#FF5733',
  secondary: '#F59E0B',
  tertiary: '#0D9488',
  border: '#E2E8F0',
};

function formatDate(value: any): string {
  if (!value) return '';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

function shortName(email?: string): string {
  if (!email) return 'Kullanıcı';
  const name = email.split('@')[0];
  return name.length > 8 ? name.slice(0, 8) + '…' : name;
}

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'keşfet' | 'takip'>('keşfet');
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCheckIns = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'check_ins'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCheckIns(items);
    } catch (error: any) {
      console.log('Akış hatası:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadPeople = useCallback(async (myUid: string) => {
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), limit(100)));
      const map: Record<string, any> = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = d.data();
      });
      setUsersMap(map);
      const others = snapshot.docs
        .filter((d) => d.id !== myUid)
        .slice(0, 15)
        .map((d) => ({ id: d.id, ...d.data() }));
      setPeople(others);
    } catch (error: any) {
      console.log('Kullanıcılar alınamadı:', error.message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then((snapshot) => {
          if (snapshot.exists()) setUserData(snapshot.data());
        });
        loadCheckIns();
        loadPeople(user.uid);
      }
    });
    return () => unsubscribe();
  }, [loadCheckIns, loadPeople]);

  function onRefresh() {
    setRefreshing(true);
    loadCheckIns();
    if (auth.currentUser) loadPeople(auth.currentUser.uid);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {loading
                ? 'Yükleniyor...'
                : 'Henüz kimse check-in yapmamış...'}
            </ThemedText>
          }
          ListHeaderComponent={
            <>
              <View style={styles.headerRow}>
                <View>
                  <ThemedText type="title">Gezgin Rotalar</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>FEED</ThemedText>
                </View>
                <View style={styles.avatarSmall}>
                  <ThemedText style={styles.avatarSmallText}>
                    {userData?.accountType === 'couple' ? '💑' : '👥'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.tabRow}>
                <Pressable
                  onPress={() => setActiveTab('keşfet')}
                  style={[
                    styles.tabButton,
                    activeTab === 'keşfet' && styles.tabButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeTab === 'keşfet' && styles.tabTextActive,
                    ]}
                  >
                    Keşfet
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setActiveTab('takip')}
                  style={[
                    styles.tabButton,
                    activeTab === 'takip' && styles.tabButtonActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeTab === 'takip' && styles.tabTextActive,
                    ]}
                  >
                    Takip Edilenler
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.statsBanner}>
                <ThemedText style={styles.statsText}>
                  📍 Toplam {checkIns.length} check-in yapıldı
                </ThemedText>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.peopleScroll}
                contentContainerStyle={styles.peopleScrollContent}
              >
                <View style={styles.avatarItem}>
                  <View style={[styles.avatarCircle, styles.avatarCircleYou]}>
                    <ThemedText style={styles.avatarEmoji}>👤</ThemedText>
                  </View>
                  <ThemedText style={styles.avatarLabel}>Sen</ThemedText>
                </View>
                {people.map((person) => (
                  <View key={person.id} style={styles.avatarItem}>
                    <View style={styles.avatarCircle}>
                      <ThemedText style={styles.avatarEmoji}>
                        {person.accountType === 'couple' ? '💑' : '👥'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.avatarLabel} numberOfLines={1}>
                      {shortName(person.email)}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            </>
          }
          renderItem={({ item }) => {
            const author = usersMap[item.userId];
            const isCouple = author?.accountType === 'couple';
            return (
              <View style={styles.postCard}>
                <View style={styles.postHeaderRow}>
                  <View style={styles.postAvatar}>
                    <ThemedText style={styles.postAvatarText}>
                      {isCouple ? '💑' : '👥'}
                    </ThemedText>
                  </View>
                  <View style={styles.postHeaderText}>
                    <ThemedText type="defaultSemiBold">
                      {isCouple ? 'Bir Çift' : 'Bir Arkadaş Grubu'}
                    </ThemedText>
                    <ThemedText style={styles.postMeta}>
                      {author?.email ?? ''}
                      {item.createdAt ? ` - ${formatDate(item.createdAt)}` : ''}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.placeTag}>
                  <ThemedText style={styles.placeTagText}>
                    📍 {item.locationName ?? 'Bilinmeyen mekan'}
                  </ThemedText>
                </View>

                {item.note ? (
                  <ThemedText style={styles.postCaption}>{item.note}</ThemedText>
                ) : null}

                <View style={styles.pointsTag}>
                  <ThemedText style={styles.pointsTagText}>
                    +{item.points ?? 10} puan
                  </ThemedText>
                </View>
              </View>
            );
          }}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 18 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
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
  statsBanner: {
    backgroundColor: '#FFF1EC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: Spacing.three,
  },
  statsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  peopleScroll: { marginBottom: Spacing.four },
  peopleScrollContent: {
    gap: 16,
    paddingRight: Spacing.four,
  },
  avatarItem: { alignItems: 'center', width: 64 },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarCircleYou: {
    backgroundColor: '#CCFBF1',
    borderWidth: 2,
    borderColor: COLORS.tertiary,
  },
  avatarEmoji: { fontSize: 22 },
  avatarLabel: { fontSize: 11, textAlign: 'center' },
  list: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: Spacing.four,
  },
  postCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 8,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: { fontSize: 16 },
  postHeaderText: { flex: 1 },
  postMeta: { fontSize: 11, color: '#94A3B8' },
  placeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  placeTagText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontWeight: '700',
  },
  postCaption: { fontSize: 13, lineHeight: 18 },
  pointsTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1EC',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pointsTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
});