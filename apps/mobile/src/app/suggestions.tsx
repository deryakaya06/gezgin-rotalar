import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { SuggestedLocation, WithId } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeInItem } from '@/components/ui/motion';
import { Tag } from '@/components/ui/tag';
import { VoteButton } from '@/components/vote-button';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { deleteSuggestion, subscribePendingSuggestions } from '@/services/suggestions';
import { confirmAction } from '@/utils/confirm';

export default function SuggestionsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<WithId<SuggestedLocation>[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    return subscribePendingSuggestions(setItems, (e) => {
      setError('Öneriler yüklenemedi: ' + e.message);
      setItems([]);
    });
  }, []);

  async function remove(item: WithId<SuggestedLocation>) {
    const ok = await confirmAction('Öneri silinsin mi?', `"${item.name}" önerisi silinecek.`, 'Sil');
    if (!ok) return;
    deleteSuggestion(item.id).catch((e: Error) => setError('Öneri silinemedi: ' + e.message));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <BackButton />
              <ThemedText type="subtitle">Mekan Önerileri</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Uygulamada görmek istediğin yerlere oy ver ya da yeni bir mekan öner.
              </ThemedText>
              <Button title="Yeni Mekan Öner" onPress={() => router.push('/suggest-location')} />
              {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const mine = item.userId === user?.uid;
            return (
              <FadeInItem index={index}>
                <Card style={styles.card}>
                  <VoteButton suggestionId={item.id} count={item.voteCount} disabled={mine} onError={setError} />
                  <View style={styles.body}>
                    <View style={styles.titleRow}>
                      <ThemedText type="heading" style={styles.title}>{item.name}</ThemedText>
                      {mine ? (
                        <Pressable
                          hitSlop={10}
                          accessibilityRole="button"
                          accessibilityLabel={`${item.name} önerisini sil`}
                          onPress={() => remove(item)}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      ) : null}
                    </View>
                    <Tag label={`${item.district} · ${item.category}`} />
                    {item.description ? <ThemedText type="small">{item.description}</ThemedText> : null}
                    <ThemedText type="caption" themeColor="textSecondary">
                      Öneren: {mine ? 'Sen' : item.userName}
                    </ThemedText>
                  </View>
                </Card>
              </FadeInItem>
            );
          }}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {items === null ? 'Yükleniyor...' : 'Henüz öneri yok. İlk mekanı sen öner!'}
            </ThemedText>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  list: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: { gap: Spacing.three, marginBottom: Spacing.one },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  body: { flex: 1, gap: Spacing.one },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  title: { flex: 1 },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
