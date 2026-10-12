import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type CheckIn, type UserProfile, type WithId } from '@repo/shared';

import { FollowButton } from '@/components/follow-button';
import { useFollow } from '@/hooks/use-follow';
import { ProfileSummary } from '@/components/profile-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0' };

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [checkIns, setCheckIns] = useState<WithId<CheckIn>[]>([]);
  const { isFollowing } = useFollow(id);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, COLLECTIONS.users, id), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, COLLECTIONS.checkIns),
      where('userId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    getDocs(q)
      .then((snapshot) => {
        setCheckIns(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...(docItem.data() as CheckIn),
          }))
        );
      })
      .catch((error) => {
        console.log('Check-inler alinamadi:', error.message);
      });
  }, [id]);

  function formatDate(timestamp: CheckIn['createdAt']) {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('tr-TR');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <Pressable onPress={() => router.back()}>
                <ThemedText style={styles.backText}>{'< Geri'}</ThemedText>
              </Pressable>

              {notFound ? (
                <ThemedText style={styles.emptyText}>Kullanıcı bulunamadı.</ThemedText>
              ) : (
                <>
                  <ProfileSummary uid={id} profile={profile} followRefreshKey={isFollowing}>
                    <View style={styles.followButtonWrap}>
                      <FollowButton userId={id} large />
                    </View>
                  </ProfileSummary>
                  <ThemedText type="defaultSemiBold">Son Check-in'ler</ThemedText>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ThemedText type="defaultSemiBold">{item.locationName}</ThemedText>
              <ThemedText style={styles.cardDate}>{formatDate(item.createdAt)}</ThemedText>
              {item.note ? <ThemedText style={styles.cardNote}>{item.note}</ThemedText> : null}
            </View>
          )}
          ListEmptyComponent={
            notFound ? null : (
              <ThemedText style={styles.emptyText}>Henüz check-in yok.</ThemedText>
            )
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
  header: { gap: Spacing.four, marginBottom: Spacing.three },
  backText: { color: COLORS.primary, fontWeight: '600' },
  followButtonWrap: { alignSelf: 'stretch', marginTop: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
  },
  cardDate: { fontSize: 12, color: '#94A3B8' },
  cardNote: { fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: Spacing.four },
});
