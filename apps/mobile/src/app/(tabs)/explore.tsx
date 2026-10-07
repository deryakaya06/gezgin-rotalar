import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { db } from '@/firebase';

const COLORS = {
  primary: '#FF5733',
  secondary: '#F59E0B',
  tertiary: '#0D9488',
  neutral: '#1E293B',
  border: '#E2E8F0',
};

const FILTERS = ['Tumu', 'Yuksek Puanlar (4.5+)', 'Ucretsiz Giris'];

const QUICK_CATEGORIES = [
  { id: 'q0', label: 'Senin Icin' },
  { id: 'q1', label: 'Galata' },
  { id: 'q2', label: 'Bogaz Keyfi' },
  { id: 'q3', label: 'Kadikoy' },
  { id: 'q4', label: 'Adalar' },
];

type Location = {
  id: string;
  name: string;
  description: string;
};

export default function ExploreScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Tumu');
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, 'locations'))
      .then((snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Location[];
        setLocations(items);
      })
      .catch((error) => {
        console.log('Mekanlar yuklenemedi:', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredLocations = locations.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
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
              <ThemedText type="title" style={styles.title}>
                Sehri Kesfet
              </ThemedText>

              <View style={styles.searchBar}>
                <ThemedText style={styles.searchIcon}>#</ThemedText>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Mekan ara..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <View style={styles.filterRow}>
                {FILTERS.map((filter) => {
                  const isActive = filter === activeFilter;
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setActiveFilter(filter)}
                      style={[
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.filterText,
                          isActive && styles.filterTextActive,
                        ]}
                      >
                        {filter}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarScroll}
                contentContainerStyle={styles.avatarScrollContent}
              >
                {QUICK_CATEGORIES.map((item) => (
                  <View key={item.id} style={styles.avatarItem}>
                    <View style={styles.avatarCircle} />
                    <ThemedText style={styles.avatarLabel}>
                      {item.label}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Tum Mekanlar
              </ThemedText>
              {loading ? (
                <ThemedText style={styles.emptyText}>Yukleniyor...</ThemedText>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
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
              <View style={styles.cardImage} />
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.cardDescription}>
                  {item.description}
                </ThemedText>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <ThemedText style={styles.emptyText}>
                Mekan bulunamadi.
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: Spacing.three,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  avatarScroll: { marginBottom: Spacing.four },
  avatarScrollContent: { gap: 16, paddingRight: Spacing.four },
  avatarItem: { alignItems: 'center', width: 64 },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE4D6',
    marginBottom: 4,
  },
  avatarLabel: { fontSize: 11, textAlign: 'center' },
  sectionTitle: { marginBottom: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: { width: 90, backgroundColor: COLORS.secondary },
  cardContent: { flex: 1, padding: Spacing.three, gap: 6 },
  cardDescription: { fontSize: 12, color: '#94A3B8' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: Spacing.four },
});