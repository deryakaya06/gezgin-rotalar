import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type CheckIn, type WithId } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

export default function RoutesScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [checkIns, setCheckIns] = useState<WithId<CheckIn>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, COLLECTIONS.checkIns),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as WithId<CheckIn>[];
        setCheckIns(items);
        setLoading(false);
      },
      (error) => {
        console.log('Check-in\'ler dinlenemedi:', error.message);
        setLoading(false);
      }
    );
  }, [user]);

  const totalPoints = checkIns.reduce((sum, item) => sum + (item.points ?? 0), 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ThemedText type="subtitle" style={styles.title}>
                Rotalarım
              </ThemedText>

              <View style={styles.summaryRow}>
                <Card style={styles.summaryBox}>
                  <ThemedText type="subtitle" style={{ color: theme.primary }}>
                    {checkIns.length}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Toplam Check-in
                  </ThemedText>
                </Card>
                <Card style={styles.summaryBox}>
                  <ThemedText type="subtitle" style={{ color: theme.primary }}>
                    {totalPoints}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Kazanılan Puan
                  </ThemedText>
                </Card>
              </View>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {"Geçmiş Check-in'ler"}
              </ThemedText>
            </>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: theme.accentSoft }]}>
                <ThemedText style={styles.cardEmoji}>📍</ThemedText>
              </View>
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold">{item.locationName}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatDate(item.createdAt)}
                </ThemedText>
                {item.note ? <ThemedText type="small">{item.note}</ThemedText> : null}
                {item.points ? <Tag label={`+${item.points} puan`} /> : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              {loading
                ? 'Yükleniyor...'
                : "Henüz bir check-in yapmadın. Keşfet sekmesinden bir mekan seçip ilk check-in'ini yap!"}
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
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  title: { marginBottom: Spacing.three },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  summaryBox: { flex: 1, alignItems: 'center', borderRadius: Radius.medium },
  sectionTitle: { marginBottom: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  cardIcon: { width: 72, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 28, lineHeight: 34 },
  cardContent: { flex: 1, padding: Spacing.three, gap: Spacing.one },
  emptyText: { textAlign: 'center', marginTop: Spacing.four },
});
