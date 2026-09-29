import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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

const NEARBY_PEOPLE = [
  { id: 'p1', label: 'Ece & Kaan', emoji: '👩‍❤️‍👨' },
  { id: 'p2', label: 'Mert & Selin', emoji: '💑' },
  { id: 'p3', label: 'Deniz & Can', emoji: '👫' },
  { id: 'p4', label: 'Ayşe & Ali', emoji: '👨‍👩‍👧' },
];

const SAMPLE_POSTS = [
  {
    id: 'post1',
    user: 'Ece & Kaan',
    time: '2 sa önce',
    location: 'Galata Kulesi & Çevre Kafeleri',
    emoji: '🗼',
    likes: 142,
    comments: 18,
    caption:
      "Karaköy'den yukarı tırmanırken ara sokaktaki minik antikacıya mutlaka uğrayın! Kahve kokusu ve plak sesleri inanılmazdı ☕️",
    tags: '#Galata #HaftasonuRotası #İstanbulRotaları',
  },
  {
    id: 'post2',
    user: 'Mert & Selin ekibi',
    time: '4 sa önce',
    location: 'Moda Sahili Gün Batımı',
    emoji: '🌇',
    likes: 94,
    comments: 9,
    caption:
      'Günün en tatlı saatinde çay bahçesinde yer bulduk! Moda sahil hattında bisiklet turu sonrası demli çay ve çekirdek idealsi kaçmaz 🍵',
    tags: '#KadıköyModa #GünBatımıNoktası #DostlukRotası',
  },
];

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'keşfet' | 'takip'>('keşfet');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then((snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.data());
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={SAMPLE_POSTS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
                  📍 Şu an İstanbul'da 48 çift aktif rotada
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
                {NEARBY_PEOPLE.map((person) => (
                  <View key={person.id} style={styles.avatarItem}>
                    <View style={styles.avatarCircle}>
                      <ThemedText style={styles.avatarEmoji}>
                        {person.emoji}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.avatarLabel}>
                      {person.label}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeaderRow}>
                <View style={styles.postAvatar}>
                  <ThemedText style={styles.postAvatarText}>
                    {item.emoji}
                  </ThemedText>
                </View>
                <View style={styles.postHeaderText}>
                  <ThemedText type="defaultSemiBold">{item.user}</ThemedText>
                  <ThemedText style={styles.postMeta}>
                    {item.time} · {item.location}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.postImage}>
                <ThemedText style={styles.postImageEmoji}>
                  {item.emoji}
                </ThemedText>
              </View>

              <View style={styles.postActionsRow}>
                <ThemedText style={styles.postAction}>
                  ❤️ {item.likes}
                </ThemedText>
                <ThemedText style={styles.postAction}>
                  💬 {item.comments}
                </ThemedText>
                <ThemedText style={styles.postAction}>🔗</ThemedText>
                <View style={styles.routeButton}>
                  <ThemedText style={styles.routeButtonText}>
                    🏆 Rotayı Al
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.postCaption}>
                {item.caption}
              </ThemedText>
              <ThemedText style={styles.postTags}>{item.tags}</ThemedText>
            </View>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  avatarSmallText: {
    fontSize: 18,
  },
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
  tabText: {
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
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
  peopleScroll: {
    marginBottom: Spacing.four,
  },
  peopleScrollContent: {
    gap: 16,
    paddingRight: Spacing.four,
  },
  avatarItem: {
    alignItems: 'center',
    width: 64,
  },
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
  avatarEmoji: {
    fontSize: 22,
  },
  avatarLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  list: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
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
  postAvatarText: {
    fontSize: 16,
  },
  postHeaderText: {
    flex: 1,
  },
  postMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  postImage: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImageEmoji: {
    fontSize: 48,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postAction: {
    fontSize: 13,
  },
  routeButton: {
    marginLeft: 'auto',
    backgroundColor: '#FFF1EC',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  routeButtonText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  postCaption: {
    fontSize: 13,
    lineHeight: 18,
  },
  postTags: {
    fontSize: 12,
    color: COLORS.tertiary,
  },
});