import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UserProfile, WithId } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { TextField } from '@/components/ui/text-field';
import { FadeInItem } from '@/components/ui/motion';
import { UserRow } from '@/components/user-row';
import { ContentColumn, Spacing } from '@/constants/theme';
import { searchUsers } from '@/services/users';

export default function SearchScreen() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<WithId<UserProfile>[]>([]);
  const [searchedFor, setSearchedFor] = useState('');
  const [error, setError] = useState('');

  // Yazmayı bitirince (300 ms) arar; her tuşta sorgu atmaz.
  useEffect(() => {
    const q = text.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(q)
        .then((users) => {
          if (cancelled) return;
          setResults(users);
          setSearchedFor(q);
          setError('');
        })
        .catch((e: Error) => {
          if (!cancelled) setError('Arama yapılamadı: ' + e.message);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  const hasQuery = text.trim().length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BackButton />
        <ThemedText type="subtitle">Gezgin Ara</ThemedText>
        <TextField
          placeholder="Görünen ad ile ara (ör. ayşe)"
          value={text}
          onChangeText={setText}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <FlatList
          data={hasQuery ? results : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <FadeInItem index={index}>
              <UserRow user={item} />
            </FadeInItem>
          )}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {error
                ? error
                : !hasQuery
                  ? 'Takip etmek istediğin çiftleri ve arkadaş gruplarını adlarıyla bul.'
                  : searchedFor === text.trim()
                    ? `"${text.trim()}" ile başlayan gezgin bulunamadı.`
                    : 'Aranıyor...'}
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
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
