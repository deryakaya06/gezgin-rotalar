import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { UserProfile, WithId } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Chip } from '@/components/ui/chip';
import { FadeInItem } from '@/components/ui/motion';
import { UserRow } from '@/components/user-row';
import { ContentColumn, Spacing } from '@/constants/theme';
import { fetchFollowList } from '@/services/users';

type ListType = 'followers' | 'following';

/** /follows?uid=...&type=followers|following — bir kullanıcının takipçileri veya takip ettikleri. */
export default function FollowsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uid: string; type?: ListType; name?: string }>();
  const type: ListType = params.type === 'following' ? 'following' : 'followers';
  const [users, setUsers] = useState<WithId<UserProfile>[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.uid) return;
    let cancelled = false;
    fetchFollowList(params.uid, type)
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch((e: Error) => {
        if (!cancelled) setError('Liste yüklenemedi: ' + e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [params.uid, type]);

  function switchTo(next: ListType) {
    if (next === type) return;
    setUsers(null);
    router.setParams({ type: next });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackButton />
        {params.name ? <ThemedText type="subtitle">{params.name}</ThemedText> : null}
        <View style={styles.tabs}>
          <Chip label="Takipçiler" selected={type === 'followers'} onPress={() => switchTo('followers')} />
          <Chip label="Takip Edilenler" selected={type === 'following'} onPress={() => switchTo('following')} />
        </View>
        <FlatList
          data={users ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <FadeInItem index={index}>
              <UserRow user={item} />
            </FadeInItem>
          )}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {error
                ? error
                : users === null
                  ? 'Yükleniyor...'
                  : type === 'followers'
                    ? 'Henüz takipçi yok.'
                    : 'Henüz kimse takip edilmiyor.'}
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
    gap: Spacing.three,
  },
  tabs: { flexDirection: 'row', gap: Spacing.four },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
