import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
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
import { ProfileSummary } from '@/components/profile-summary';
import { CheckInPhoto } from '@/components/check-in-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { db } from '@/firebase';
import { useFollow } from '@/hooks/use-follow';
import { formatDate } from '@/utils/format';

export default function UserProfileScreen() {
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
        console.log('Check-in\'ler alınamadı:', error.message);
      });
  }, [id]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <BackButton />

              {notFound ? (
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Kullanıcı bulunamadı.
                </ThemedText>
              ) : (
                <>
                  <ProfileSummary uid={id} profile={profile} followRefreshKey={isFollowing}>
                    <View style={styles.followButtonWrap}>
                      <FollowButton userId={id} large />
                    </View>
                  </ProfileSummary>
                  <ThemedText type="defaultSemiBold">{"Son Check-in'ler"}</ThemedText>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <ThemedText type="defaultSemiBold">{item.locationName}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {formatDate(item.createdAt)}
              </ThemedText>
              {item.photoUrl ? <CheckInPhoto url={item.photoUrl} style={styles.photo} /> : null}
              {item.note ? <ThemedText type="small">{item.note}</ThemedText> : null}
            </Card>
          )}
          ListEmptyComponent={
            notFound ? null : (
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                Henüz check-in yok.
              </ThemedText>
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
  followButtonWrap: { alignSelf: 'stretch', marginTop: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: { gap: Spacing.one },
  photo: { marginTop: Spacing.two },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
