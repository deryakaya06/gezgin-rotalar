import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { Location, WithId } from '@repo/shared';

import { Image } from 'expo-image';

import { LocationMap } from '@/components/location-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { Tag } from '@/components/ui/tag';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { photoThumbnail } from '@/services/photos';
import {
  LOCATION_FILTERS,
  districtsOf,
  fetchLocations,
  filterLocations,
  type LocationFilter,
} from '@/services/locations';

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filter, setFilter] = useState<LocationFilter>('Tümü');
  const [district, setDistrict] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState<WithId<Location>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch((error) => {
        console.log('Mekanlar yüklenemedi:', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const visible = filterLocations(locations, { search, filter, district });
  const districts = districtsOf(locations);

  function openLocation(location: WithId<Location>) {
    router.push({ pathname: '/location/[id]', params: { id: location.id } });
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle">Şehri Keşfet</ThemedText>
        <View style={styles.viewToggle}>
          <Chip label="Liste" selected={view === 'list'} onPress={() => setView('list')} />
          <Chip label="Harita" selected={view === 'map'} onPress={() => setView('map')} />
        </View>
      </View>

      <TextField
        placeholder="Mekan, ilçe veya kategori ara..."
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      <View style={styles.chipRow}>
        {LOCATION_FILTERS.map((f) => (
          <Chip key={f} label={f} selected={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>

      {districts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.districtRow}
        >
          <Chip label="Tüm İlçeler" selected={district === null} onPress={() => setDistrict(null)} />
          {districts.map((d) => (
            <Chip
              key={d}
              label={d}
              selected={district === d}
              onPress={() => setDistrict(district === d ? null : d)}
            />
          ))}
        </ScrollView>
      )}

      <ThemedText type="caption" themeColor="textSecondary">
        {loading ? 'Yükleniyor...' : `${visible.length} mekan`}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {view === 'map' ? (
          <View style={styles.mapContainer}>
            {header}
            <LocationMap locations={visible} onSelect={openLocation} style={styles.map} />
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={header}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: item.isSponsored ? theme.highlight : theme.border },
                  pressed && styles.pressed,
                ]}
                onPress={() => openLocation(item)}
              >
                {item.coverPhotoUrl ? (
                  <Image
                    source={{ uri: photoThumbnail(item.coverPhotoUrl, 240, 300) }}
                    style={[styles.cardImage, { backgroundColor: theme.highlightSoft }]}
                    contentFit="cover"
                    transition={150}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: theme.highlightSoft }]}>
                    <ThemedText style={styles.cardEmoji}>{categoryEmoji(item.category)}</ThemedText>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    {item.rating ? (
                      <ThemedText type="smallBold" style={{ color: theme.highlight }}>
                        ★ {item.rating.toFixed(1)}
                      </ThemedText>
                    ) : null}
                  </View>
                  {item.category || item.district ? (
                    <ThemedText type="caption" themeColor="textSecondary">
                      {[item.category, item.district].filter(Boolean).join(' · ')}
                    </ThemedText>
                  ) : null}
                  <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                    {item.description}
                  </ThemedText>
                  <View style={styles.tagRow}>
                    {item.isSponsored ? <Tag label="Sponsorlu" /> : null}
                    {item.isFree ? <Tag label="Ücretsiz" tone="accent" /> : null}
                  </View>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              !loading ? (
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Bu filtrelere uyan mekan bulunamadı.
                </ThemedText>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  Tarihi: '🏛️',
  Müze: '🖼️',
  Park: '🌳',
  Manzara: '🌅',
  Çarşı: '🛍️',
  Sokak: '🚶',
  Ada: '⛴️',
};

function categoryEmoji(category?: string) {
  return (category && CATEGORY_EMOJI[category]) ?? '📍';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  header: { gap: Spacing.three, marginBottom: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewToggle: { flexDirection: 'row', gap: Spacing.one },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  districtRow: { gap: Spacing.two, paddingRight: Spacing.four },
  mapContainer: { flex: 1, paddingBottom: Spacing.three },
  map: { flex: 1 },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
  cardImage: { width: 96, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 30, lineHeight: 36 },
  cardContent: { flex: 1, padding: Spacing.three, gap: Spacing.one },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { flex: 1 },
  tagRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
