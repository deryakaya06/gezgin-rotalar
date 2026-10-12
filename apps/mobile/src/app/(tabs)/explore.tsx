import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS, type Location, type WithId } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { db } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';

const FILTERS = ['Tümü', 'Yüksek Puanlı (4.5+)', 'Ücretsiz Giriş'];

const QUICK_CATEGORIES = [
  { id: 'q0', label: 'Senin İçin' },
  { id: 'q1', label: 'Galata' },
  { id: 'q2', label: 'Boğaz Keyfi' },
  { id: 'q3', label: 'Kadıköy' },
  { id: 'q4', label: 'Adalar' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState<WithId<Location>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, COLLECTIONS.locations))
      .then((snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as WithId<Location>[];
        setLocations(items);
      })
      .catch((error) => {
        console.log('Mekanlar yüklenemedi:', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredLocations = locations.filter((item) =>
    item.name.toLocaleLowerCase('tr').includes(search.trim().toLocaleLowerCase('tr'))
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ThemedText type="subtitle" style={styles.title}>
                Şehri Keşfet
              </ThemedText>

              <TextField
                style={styles.search}
                placeholder="Mekan ara..."
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />

              <View style={styles.filterRow}>
                {FILTERS.map((filter) => (
                  <Chip
                    key={filter}
                    label={filter}
                    selected={filter === activeFilter}
                    onPress={() => setActiveFilter(filter)}
                  />
                ))}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarScroll}
                contentContainerStyle={styles.avatarScrollContent}
              >
                {QUICK_CATEGORIES.map((item) => (
                  <View key={item.id} style={styles.avatarItem}>
                    <View style={[styles.avatarCircle, { backgroundColor: theme.highlightSoft }]} />
                    <ThemedText type="caption" style={styles.avatarLabel}>
                      {item.label}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Tüm Mekanlar
              </ThemedText>
              {loading ? (
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Yükleniyor...
                </ThemedText>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/location-detail',
                  params: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                  },
                })
              }
            >
              <View style={[styles.cardImage, { backgroundColor: theme.highlight }]} />
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.description}
                </ThemedText>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                Mekan bulunamadı.
              </ThemedText>
            ) : null
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
  title: { marginBottom: Spacing.three },
  search: { marginBottom: Spacing.three },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  avatarScroll: { marginBottom: Spacing.four },
  avatarScrollContent: { gap: Spacing.three, paddingRight: Spacing.four },
  avatarItem: { alignItems: 'center', width: 64 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, marginBottom: Spacing.one },
  avatarLabel: { textAlign: 'center' },
  sectionTitle: { marginBottom: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
  cardImage: { width: 90 },
  cardContent: { flex: 1, padding: Spacing.three, gap: 6 },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
