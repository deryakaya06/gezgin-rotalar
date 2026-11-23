import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import {
  COLLECTIONS,
  type CheckIn,
  type Coordinates,
  type PlannedTrip,
  type UserProfile,
  type WithId,
} from '@repo/shared';

import { RouteMap } from '@/components/route-map';
import { ThemedCalendar } from '@/components/themed-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ContentColumn, RouteColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { useRouteAnimation } from '@/hooks/use-route-animation';
import { useTheme } from '@/hooks/use-theme';
import { fetchDayCheckIns } from '@/services/checkins';
import { fetchLocations } from '@/services/locations';
import { deletePlannedTrip, subscribePlannedTrips } from '@/services/trips';
import { fetchFollowList } from '@/services/users';
import { confirmAction } from '@/utils/confirm';
import { dayKey, groupCheckInsByDay, routeStops, type MapRoute } from '@/utils/route';

/** Haritada kullanıcının yanında en fazla bu kadar kişi gösterilir (renk sayısı). */
const MAX_COMPANIONS = RouteColors.light.length - 1;

function formatDay(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}

/** Seçili günün rotaları. Gün veya kişiler değişince key ile yeniden kurulur, animasyon baştan oynar. */
function DayRoute({ routes }: { routes: MapRoute[] }) {
  const { paths, canReplay, replay } = useRouteAnimation(routes);

  return (
    <>
      <RouteMap routes={routes} paths={paths} style={styles.map} />
      {routes.length > 1 ? (
        <View style={styles.legend}>
          {routes.map((route) => (
            <View key={route.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: route.color }]} />
              <ThemedText type="caption" themeColor="textSecondary">
                {route.name} · {route.stops.length} durak
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
      {canReplay ? (
        <Button title="Rotayı Tekrar Oynat" variant="outline" size="small" onPress={replay} style={styles.replay} />
      ) : null}
    </>
  );
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const scheme = useColorScheme();
  const router = useRouter();
  const uid = user?.uid;
  const palette = RouteColors[scheme === 'dark' ? 'dark' : 'light'];
  const [checkIns, setCheckIns] = useState<WithId<CheckIn>[]>([]);
  const [trips, setTrips] = useState<WithId<PlannedTrip>[]>([]);
  const [coordinatesById, setCoordinatesById] = useState<ReadonlyMap<string, Coordinates>>(new Map());
  const [following, setFollowing] = useState<WithId<UserProfile>[]>([]);
  const [companionIds, setCompanionIds] = useState<string[]>([]);
  const [companionData, setCompanionData] = useState<{
    key: string;
    byId: Record<string, WithId<CheckIn>[]>;
  } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(
        collection(db, COLLECTIONS.checkIns),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        setCheckIns(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as CheckIn) })));
        setLoading(false);
      },
      (e) => {
        setError('Takvim yüklenemedi: ' + e.message);
        setLoading(false);
      }
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    return subscribePlannedTrips(uid, setTrips, (e) => setError('Planlar yüklenemedi: ' + e.message));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    fetchFollowList(uid, 'following')
      .then(setFollowing)
      .catch((e: Error) => console.log('Takip listesi alınamadı:', e.message));
  }, [uid]);

  // Check-in kayıtlarında koordinat yok; rota için mekanlardan alınır.
  useEffect(() => {
    fetchLocations()
      .then((locations) => {
        setCoordinatesById(
          new Map(locations.flatMap((l) => (l.coordinates ? [[l.id, l.coordinates] as const] : [])))
        );
      })
      .catch((e: Error) => setError('Mekan konumları yüklenemedi: ' + e.message));
  }, []);

  const days = useMemo(() => groupCheckInsByDay(checkIns), [checkIns]);
  // Gün seçilmediyse son check-in yapılan gün açılır.
  const selected = picked ?? [...days.keys()].at(-1) ?? dayKey(new Date());
  const dayCheckIns = useMemo(() => days.get(selected) ?? [], [days, selected]);
  const dayTrips = useMemo(() => trips.filter((trip) => trip.date === selected), [trips, selected]);
  const companionKey = `${selected}|${companionIds.join(',')}`;

  useEffect(() => {
    if (companionIds.length === 0) return;
    let cancelled = false;
    Promise.all(companionIds.map((id) => fetchDayCheckIns(id, selected)))
      .then((lists) => {
        if (cancelled) return;
        setCompanionData({
          key: companionKey,
          byId: Object.fromEntries(companionIds.map((id, i) => [id, lists[i]])),
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError('Kişilerin rotası yüklenemedi: ' + e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [companionIds, selected, companionKey]);

  const routes = useMemo(() => {
    const own: MapRoute = {
      id: uid ?? 'me',
      name: 'Sen',
      color: palette[0],
      stops: routeStops(dayCheckIns, coordinatesById),
    };
    const byId = companionData?.key === companionKey ? companionData.byId : {};
    const others = companionIds.map((id, index): MapRoute => {
      const list = [...(byId[id] ?? [])].reverse();
      return {
        id,
        name: following.find((f) => f.id === id)?.displayName ?? 'Gezgin',
        color: palette[index + 1],
        stops: routeStops(list, coordinatesById),
      };
    });
    return [own, ...others].filter((route) => route.stops.length > 0);
  }, [uid, palette, dayCheckIns, coordinatesById, companionData, companionKey, companionIds, following]);

  const routeKey = `${selected}|${routes.map((r) => `${r.id}:${r.stops.length}`).join(',')}`;

  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        dots: { key: string; color: string; selectedDotColor: string }[];
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};
    const addDot = (key: string, dot: string, color: string) => {
      marks[key] ??= { dots: [] };
      if (!marks[key].dots.some((d) => d.key === dot)) {
        marks[key].dots.push({ key: dot, color, selectedDotColor: theme.onPrimary });
      }
    };
    for (const key of days.keys()) addDot(key, 'checkin', theme.highlight);
    for (const trip of trips) addDot(trip.date, 'plan', theme.primary);
    marks[selected] = {
      dots: marks[selected]?.dots ?? [],
      selected: true,
      selectedColor: theme.primary,
    };
    return marks;
  }, [days, trips, selected, theme]);

  function toggleCompanion(id: string) {
    setCompanionIds((prev) =>
      prev.includes(id)
        ? prev.filter((value) => value !== id)
        : prev.length < MAX_COMPANIONS
          ? [...prev, id]
          : prev
    );
  }

  async function removeTrip(trip: WithId<PlannedTrip>) {
    const ok = await confirmAction('Plan silinsin mi?', `"${trip.title}" planı silinecek.`, 'Sil');
    if (!ok) return;
    deletePlannedTrip(trip.id).catch((e: Error) => setError('Plan silinemedi: ' + e.message));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <BackButton />
          <ThemedText type="subtitle">Takvimim</ThemedText>

          <Card style={styles.calendarCard}>
            <ThemedCalendar
              current={selected}
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={(day) => setPicked(day.dateString)}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.highlight }]} />
                <ThemedText type="caption" themeColor="textSecondary">Check-in</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <ThemedText type="caption" themeColor="textSecondary">Plan</ThemedText>
              </View>
            </View>
          </Card>

          <Button
            title="Gezi Planla"
            onPress={() => router.push({ pathname: '/plan-trip', params: { date: selected } })}
          />

          <ThemedText type="heading">{formatDay(selected)}</ThemedText>

          {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}

          {dayTrips.map((trip) => (
            <Card key={trip.id} style={styles.trip}>
              <View style={styles.tripHead}>
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                <ThemedText type="defaultSemiBold" style={styles.stopText}>{trip.title}</ThemedText>
                <Pressable
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`${trip.title} planını sil`}
                  onPress={() => removeTrip(trip)}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {trip.locationNames.map((name, index) => `${index + 1}. ${name}`).join('  ·  ')}
              </ThemedText>
              {trip.note ? <ThemedText type="small">{trip.note}</ThemedText> : null}
            </Card>
          ))}

          {following.length > 0 ? (
            <View style={styles.companions}>
              <ThemedText type="caption" themeColor="textSecondary">
                Rotayı birlikte göster (en fazla {MAX_COMPANIONS} kişi)
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {following.map((person) => (
                  <Chip
                    key={person.id}
                    label={person.displayName}
                    selected={companionIds.includes(person.id)}
                    onPress={() => toggleCompanion(person.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {routes.length > 0 ? <DayRoute key={routeKey} routes={routes} /> : null}

          {dayCheckIns.length > 0 ? (
            <View style={styles.stops}>
              {dayCheckIns.map((checkIn) => (
                <Card key={checkIn.id} style={styles.stop}>
                  <View style={[styles.pin, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name="location" size={16} color={theme.primary} />
                  </View>
                  <View style={styles.stopText}>
                    <ThemedText type="defaultSemiBold">{checkIn.locationName}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {checkIn.createdAt?.toDate?.().toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) ?? '...'}
                    </ThemedText>
                  </View>
                </Card>
              ))}
            </View>
          ) : !error && dayTrips.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {loading ? 'Yükleniyor...' : 'Bu günde check-in veya plan yok.'}
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  calendarCard: { padding: Spacing.two, gap: Spacing.two },
  map: { height: 260 },
  replay: { alignSelf: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  trip: { gap: Spacing.one },
  tripHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  companions: { gap: Spacing.two },
  chips: { gap: Spacing.two },
  stops: { gap: Spacing.two },
  stop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  pin: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stopText: { flex: 1 },
  empty: { textAlign: 'center', marginTop: Spacing.two },
});
