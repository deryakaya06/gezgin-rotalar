import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, db } from '@/firebase';

const COLORS = {
  primary: '#FF5733',
  tertiary: '#0D9488',
  border: '#E2E8F0',
};

type CheckIn = {
  id: string;
  locationName: string;
  note: string;
  points: number;
  createdAt: any;
};

export default function RoutesScreen() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCheckIns([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'check_ins'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })) as CheckIn[];
          setCheckIns(items);
          setLoading(false);
        },
        (error) => {
          console.log('Firestore dinleme hatasi:', error.message);
          setLoading(false);
        }
      );

      return unsubscribeSnapshot;
    });

    return () => unsubscribeAuth();
  }, []);

  const totalPoints = checkIns.reduce((sum, item) => sum + (item.points || 0), 0);

  function formatDate(timestamp: any) {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('tr-TR');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ThemedText type="title" style={styles.title}>
                Rotalarim
              </ThemedText>

              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <ThemedText type="title" style={styles.summaryNumber}>
                    {checkIns.length}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>
                    Toplam Check-in
                  </ThemedText>
                </View>
                <View style={styles.summaryBox}>
                  <ThemedText type="title" style={styles.summaryNumber}>
                    {totalPoints}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>
                    Kazanilan Puan
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Gecmis Check-in'ler
              </ThemedText>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <ThemedText style={styles.cardEmoji}>#</ThemedText>
              </View>
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold">
                  {item.locationName}
                </ThemedText>
                <ThemedText style={styles.cardDate}>
                  {formatDate(item.createdAt)}
                </ThemedText>
                {item.note ? (
                  <ThemedText style={styles.cardNote}>{item.note}</ThemedText>
                ) : null}
                <View style={styles.cardStatsRow}>
                  <View style={styles.cardTag}>
                    <ThemedText style={styles.cardTagText}>
                      +{item.points} puan
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              {loading
                ? 'Yukleniyor...'
                : "Henuz bir check-in yapmadin. Ekle sekmesinden ilk check-in'ini yap!"}
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
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
  },
  summaryNumber: { fontSize: 22, color: COLORS.primary },
  summaryLabel: { fontSize: 11, color: '#94A3B8' },
  sectionTitle: { marginBottom: Spacing.three },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardIcon: {
    width: 72,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28 },
  cardContent: { flex: 1, padding: Spacing.three, gap: 4 },
  cardDate: { fontSize: 12, color: '#94A3B8' },
  cardNote: { fontSize: 13 },
  cardStatsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cardTag: {
    backgroundColor: '#FFF1EC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardTagText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: Spacing.four },
});