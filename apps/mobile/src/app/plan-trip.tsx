import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MAX_TRIP_STOPS, type Location, type WithId } from '@repo/shared';

import { ThemedCalendar } from '@/components/themed-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useScrollToInput } from '@/hooks/use-scroll-to-input';
import { useTheme } from '@/hooks/use-theme';
import { fetchLocations, filterLocations } from '@/services/locations';
import { createPlannedTrip } from '@/services/trips';
import { dayKey } from '@/utils/route';

const VISIBLE_RESULTS = 6;

/** /plan-trip?date=2026-12-05 — ileri tarihli gezi planı formu. */
export default function PlanTripScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { scrollRef, inputProps } = useScrollToInput();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [today] = useState(() => dayKey(new Date()));
  const [date, setDate] = useState(params.date && params.date >= today ? params.date : today);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState<WithId<Location>[]>([]);
  const [selected, setSelected] = useState<WithId<Location>[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch((e: Error) => setError('Mekanlar yüklenemedi: ' + e.message));
  }, []);

  const results = useMemo(
    () =>
      filterLocations(locations, { search, filter: 'Tümü', district: null })
        .filter((l) => !selected.some((s) => s.id === l.id))
        .slice(0, VISIBLE_RESULTS),
    [locations, search, selected]
  );

  async function save() {
    const cleanTitle = title.trim();
    if (cleanTitle.length < 2) return setError('Plana en az 2 harfli bir ad ver.');
    if (selected.length === 0) return setError('En az bir mekan ekle.');
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await createPlannedTrip(user.uid, {
        title: cleanTitle,
        date,
        locationIds: selected.map((l) => l.id),
        locationNames: selected.map((l) => l.name),
        note: note.trim(),
      });
      if (router.canGoBack()) router.back();
      else router.replace('/calendar');
    } catch (e) {
      setError('Plan kaydedilemedi: ' + (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* iOS'ta klavye boşluğunu ScrollView kendisi ayarlar; ikisi birlikte çakışır. */}
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'android' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton />
          <ThemedText type="subtitle">Gezi Planla</ThemedText>

          <TextField placeholder="Plan adı (ör. Boğaz turu)" value={title} onChangeText={setTitle} maxLength={80} />

          <Card style={styles.calendarCard}>
            <ThemedCalendar
              current={date}
              minDate={today}
              markedDates={{ [date]: { selected: true, selectedColor: theme.primary } }}
              onDayPress={(day) => setDate(day.dateString)}
            />
          </Card>

          <ThemedText type="defaultSemiBold">
            Duraklar ({selected.length}/{MAX_TRIP_STOPS})
          </ThemedText>
          {selected.map((location, index) => (
            <Card key={location.id} style={styles.row}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {index + 1}
              </ThemedText>
              <ThemedText style={styles.rowText}>{location.name}</ThemedText>
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`${location.name} durağını çıkar`}
                onPress={() => setSelected((prev) => prev.filter((l) => l.id !== location.id))}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </Card>
          ))}

          {selected.length < MAX_TRIP_STOPS ? (
            <>
              <TextField
                placeholder="Mekan, ilçe veya kategori ara..."
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {results.map((location) => (
                <Pressable
                  key={location.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${location.name} durağını ekle`}
                  onPress={() => setSelected((prev) => [...prev, location])}
                  style={({ pressed }) => [
                    styles.result,
                    { borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowText}>
                    <ThemedText type="small">{location.name}</ThemedText>
                    {location.district ? (
                      <ThemedText type="caption" themeColor="textSecondary">
                        {location.district}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                </Pressable>
              ))}
            </>
          ) : null}

          <TextField
            placeholder="Not (isteğe bağlı)"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            style={styles.note}
            {...inputProps}
          />

          {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
          <Button title={saving ? 'Kaydediliyor...' : 'Planı Kaydet'} disabled={saving} onPress={save} />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  keyboard: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  calendarCard: { padding: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  rowText: { flex: 1 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.7 },
  note: { minHeight: 80, textAlignVertical: 'top' },
});
