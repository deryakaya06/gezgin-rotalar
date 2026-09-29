import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const COLORS = {
  primary: '#FF5733',
  secondary: '#F59E0B',
  tertiary: '#0D9488',
  neutral: '#1E293B',
  border: '#E2E8F0',
};

const FILTERS = ['Tümü', 'Yüksek Puanlar (4.5+)', 'Ücretsiz Giriş'];

const QUICK_CATEGORIES = [
  { id: 'q0', label: 'Senin İçin', emoji: '✨' },
  { id: 'q1', label: 'Galata', emoji: '🗼' },
  { id: 'q2', label: 'Boğaz Keyfi', emoji: '⛴️' },
  { id: 'q3', label: 'Kadıköy', emoji: '🎨' },
  { id: 'q4', label: 'Adalar', emoji: '🏝️' },
];

const SAMPLE_LOCATIONS = [
  {
    id: '1',
    name: 'Karaköy Güllüoğlu',
    category: 'Kahve & Tatlı',
    rating: 4.8,
    description: 'Boğaz manzaralı, tarihi bir baklava ve kahve durağı.',
    emoji: '☕️',
  },
  {
    id: '2',
    name: 'Balat Sokakları',
    category: 'Gezi & Fotoğraf',
    rating: 4.9,
    description: 'Renkli evleriyle ünlü, yürüyerek keşfedilecek tarihi mahalle.',
    emoji: '📸',
  },
  {
    id: '3',
    name: 'Moda Sahili',
    category: 'Deniz Kenarı',
    rating: 4.7,
    description: 'Gün batımını izlemek için sakin bir buluşma noktası.',
    emoji: '🌅',
  },
  {
    id: '4',
    name: 'Kadıköy Çarşı',
    category: 'Yeme & İçme',
    rating: 4.6,
    description: 'Sokak lezzetleri ve canlı gece hayatıyla dolu bir bölge.',
    emoji: '🍢',
  },
];

export default function ExploreScreen() {
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [search, setSearch] = useState('');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={SAMPLE_LOCATIONS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ThemedText type="title" style={styles.title}>
                Şehri Keşfet
              </ThemedText>

              <View style={styles.searchBar}>
                <ThemedText style={styles.searchIcon}>🔍</ThemedText>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Mekan, rota veya sanat ara..."
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
                    <View style={styles.avatarCircle}>
                      <ThemedText style={styles.avatarEmoji}>
                        {item.emoji}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.avatarLabel}>
                      {item.label}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.sponsoredCard}>
                <View style={styles.sponsoredBadge}>
                  <ThemedText style={styles.sponsoredBadgeText}>
                    SPONSORLU KEŞİF
                  </ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={styles.sponsoredTitle}>
                  The Grand Tarabya — Kıyı Yürüyüşü
                </ThemedText>
                <ThemedText style={styles.sponsoredDescription}>
                  Boğaz'ın en taze esintisinde zengin serpme kahvaltı ile
                  başlayan keyifli yürüyüş.
                </ThemedText>
                <View style={styles.sponsoredTagsRow}>
                  <View style={styles.sponsoredTag}>
                    <ThemedText style={styles.sponsoredTagText}>
                      2x Puan (150 XP)
                    </ThemedText>
                  </View>
                  <View style={styles.sponsoredTag}>
                    <ThemedText style={styles.sponsoredTagText}>
                      %15 Çift İndirimi
                    </ThemedText>
                  </View>
                </View>
                <Pressable style={styles.sponsoredButton}>
                  <ThemedText style={styles.sponsoredButtonText}>
                    Rotayı İncele & Check-in Başlat
                  </ThemedText>
                </Pressable>
              </View>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Öne Çıkan Popüler Mekanlar
              </ThemedText>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardImage}>
                <ThemedText style={styles.cardEmoji}>{item.emoji}</ThemedText>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                  <View style={styles.ratingBadge}>
                    <ThemedText style={styles.ratingText}>
                      ⭐ {item.rating}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.categoryTag}>
                  <ThemedText style={styles.categoryText}>
                    {item.category}
                  </ThemedText>
                </View>
                <ThemedText type="small">{item.description}</ThemedText>
              </View>
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
  title: {
    marginBottom: Spacing.three,
  },
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
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
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
  filterText: {
    fontSize: 13,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  avatarScroll: {
    marginBottom: Spacing.three,
  },
  avatarScrollContent: {
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
  avatarEmoji: {
    fontSize: 24,
  },
  avatarLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  sponsoredCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    gap: 8,
  },
  sponsoredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sponsoredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sponsoredTitle: {
    color: '#fff',
    fontSize: 16,
  },
  sponsoredDescription: {
    color: '#FFE4D6',
    fontSize: 13,
  },
  sponsoredTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sponsoredTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sponsoredTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  sponsoredButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  sponsoredButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: 90,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.three,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400E',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#CCFBF1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontWeight: '600',
  },
});