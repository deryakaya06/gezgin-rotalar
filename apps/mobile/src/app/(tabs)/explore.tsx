import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { Location, WithId } from '@repo/shared';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { LocationMap } from '@/components/location-map';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip } from '@/components/ui/chip';
import { FadeInItem, PressableScale } from '@/components/ui/motion';
import { TextField } from '@/components/ui/text-field';
import { ContentColumn, OnPhoto, Radius, Spacing } from '@/constants/theme';
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
            renderItem={({ item, index }) => (
              <FadeInItem index={index}>
                <PressableScale
                  style={styles.card}
                  onPress={() => openLocation(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${[item.category, item.district].filter(Boolean).join(', ')}`}
                >
                  <View style={[styles.cover, { backgroundColor: theme.backgroundElement }]}>
                    {item.coverPhotoUrl ? (
                      <Image
                        source={{ uri: photoThumbnail(item.coverPhotoUrl, 800, 600) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={150}
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <ThemedText style={styles.coverEmoji}>{categoryEmoji(item.category)}</ThemedText>
                    )}
                    {item.isSponsored ? (
                      <View style={styles.badge}>
                        <ThemedText type="caption" style={styles.badgeText}>
                          SPONSORLU
                        </ThemedText>
                      </View>
                    ) : null}
                    {/* Alttan koyulaşan geçiş: ad ve bilgiler fotoğrafın üstünde okunur. */}
                    <LinearGradient colors={['transparent', OnPhoto.scrim]} style={styles.shade}>
                      <View style={styles.shadeText}>
                        <ThemedText type="heading" style={styles.onPhoto} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <ThemedText type="caption" style={styles.onPhotoSoft} numberOfLines={1}>
                          {[item.category, item.district, item.isFree ? 'Ücretsiz giriş' : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </ThemedText>
                      </View>
                      {item.rating ? (
                        <ThemedText type="smallBold" style={styles.rating}>
                          ★ {item.rating.toFixed(1)}
                        </ThemedText>
                      ) : null}
                    </LinearGradient>
                  </View>
                </PressableScale>
              </FadeInItem>
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
  Lezzet: '🍰',
};

function categoryEmoji(category?: string) {
  return (category && CATEGORY_EMOJI[category]) ?? '📍';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  header: { gap: Spacing.three, marginBottom: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewToggle: { flexDirection: 'row', gap: Spacing.three },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.four },
  districtRow: { gap: Spacing.four, paddingRight: Spacing.four },
  mapContainer: { flex: 1, paddingBottom: Spacing.three },
  map: { flex: 1 },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: { borderRadius: Radius.large, overflow: 'hidden' },
  cover: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 40, lineHeight: 48 },
  badge: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: OnPhoto.badge,
  },
  badgeText: { color: OnPhoto.badgeText, fontWeight: 700, letterSpacing: 1.2, fontSize: 10 },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  shadeText: { flex: 1, gap: 2 },
  onPhoto: { color: OnPhoto.text },
  onPhotoSoft: { color: OnPhoto.textSoft, letterSpacing: 0.3 },
  rating: { color: OnPhoto.rating },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
