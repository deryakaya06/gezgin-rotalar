import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
  DUPLICATE_CHECKIN_WINDOW_HOURS,
  POINTS_PER_CHECKIN,
  type Location,
  type WithId,
} from '@repo/shared';

import { LocationMap } from '@/components/location-map';
import { PhotoPicker } from '@/components/photo-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { TextField } from '@/components/ui/text-field';
import { ContentColumn, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { createCheckIn } from '@/services/checkins';
import { directionsUrl, fetchLocation } from '@/services/locations';
import {
  isPhotoUploadConfigured,
  photoThumbnail,
  uploadPhoto,
  type PickedPhoto,
} from '@/services/photos';

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();

  const [location, setLocation] = useState<WithId<Location> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notFound'>('loading');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [saving, setSaving] = useState<false | 'uploading' | 'saving'>(false);

  useEffect(() => {
    let cancelled = false;
    fetchLocation(id)
      .then((result) => {
        if (cancelled) return;
        setLocation(result);
        setStatus(result ? 'ready' : 'notFound');
      })
      .catch((error) => {
        console.log('Mekan yüklenemedi:', error.message);
        if (!cancelled) setStatus('notFound');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleCheckIn() {
    if (!user || !location) return;

    setMessage('');
    let photoUrl: string | undefined;
    if (photo) {
      setSaving('uploading');
      try {
        photoUrl = await uploadPhoto(photo);
      } catch (error: any) {
        setMessage('Fotoğraf yüklenemedi: ' + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving('saving');
    createCheckIn(user.uid, { id: location.id, name: location.name }, note.trim(), photoUrl)
      .then((points) => {
        setMessage(
          points > 0
            ? `Check-in başarılı! +${points} puan kazandın.`
            : `Check-in kaydedildi. Bu mekana son ${DUPLICATE_CHECKIN_WINDOW_HOURS} saatte zaten check-in yaptığın için puan verilmedi.`
        );
        setNote('');
        setPhoto(null);
      })
      .catch((error) => {
        setMessage('Hata: ' + error.message);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  if (status !== 'ready' || !location) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.content]}>
          <BackButton />
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {status === 'loading' ? 'Yükleniyor...' : 'Mekan bulunamadı.'}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const coordinates = location.coordinates;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton />

          {location.coverPhotoUrl ? (
            <View style={styles.coverBlock}>
              <Image
                source={{ uri: photoThumbnail(location.coverPhotoUrl, 1200, 750) }}
                style={[styles.cover, { backgroundColor: theme.backgroundElement }]}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`${location.name} fotoğrafı`}
              />
              {location.coverPhotoCredit ? (
                <Pressable
                  disabled={!location.coverPhotoSource}
                  onPress={() => location.coverPhotoSource && Linking.openURL(location.coverPhotoSource)}
                  hitSlop={6}
                >
                  <ThemedText type="caption" themeColor="textSecondary">
                    Fotoğraf: {location.coverPhotoCredit}
                    {location.coverPhotoSource ? ' · Wikimedia Commons' : ''}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.titleBlock}>
            <ThemedText type="subtitle">{location.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {[location.category, location.district].filter(Boolean).join(' · ')}
              {location.rating ? (
                <ThemedText type="smallBold" style={{ color: theme.highlight }}>
                  {'  '}★ {location.rating.toFixed(1)}
                </ThemedText>
              ) : null}
            </ThemedText>
            <View style={styles.tagRow}>
              {location.isSponsored ? <Tag label="Sponsorlu" /> : null}
              {location.isFree ? <Tag label="Ücretsiz Giriş" tone="accent" /> : null}
            </View>
          </View>

          <ThemedText>{location.description}</ThemedText>

          {location.isSponsored && location.sponsorInfo ? (
            <Card style={[styles.sponsorCard, { borderColor: theme.highlight }]}>
              <ThemedText type="smallBold">{location.sponsorInfo.name}</ThemedText>
              {location.sponsorInfo.offer ? (
                <ThemedText type="small">{location.sponsorInfo.offer}</ThemedText>
              ) : null}
            </Card>
          ) : null}

          {coordinates ? (
            <>
              <LocationMap
                locations={[location]}
                interactive={false}
                initialRegion={{ ...coordinates, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                style={styles.map}
              />
              <Button
                title="Yol Tarifi Al"
                variant="outline"
                onPress={() => Linking.openURL(directionsUrl(location, Platform.OS))}
              />
            </>
          ) : null}

          <View style={styles.checkIn}>
            {isPhotoUploadConfigured ? (
              <>
                <ThemedText type="smallBold">Fotoğraf (isteğe bağlı)</ThemedText>
                <PhotoPicker photo={photo} onChange={setPhoto} disabled={!!saving} />
              </>
            ) : null}

            <ThemedText type="smallBold">Not (isteğe bağlı)</ThemedText>
            <TextField
              style={styles.noteInput}
              placeholder="Bu mekanda neler yaşadın?"
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
            />
            <Button
              title={
                saving === 'uploading'
                  ? 'Fotoğraf yükleniyor...'
                  : saving === 'saving'
                    ? 'Kaydediliyor...'
                    : `Check-in Yap (+${POINTS_PER_CHECKIN} Puan)`
              }
              onPress={handleCheckIn}
              disabled={!!saving}
            />
            {message ? (
              <ThemedText type="small" style={styles.centered}>
                {message}
              </ThemedText>
            ) : null}
          </View>
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
  coverBlock: { gap: Spacing.one },
  cover: { width: '100%', aspectRatio: 16 / 10, borderRadius: Radius.large },
  titleBlock: { gap: Spacing.one },
  tagRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  sponsorCard: { gap: Spacing.one },
  map: { height: 180 },
  checkIn: { gap: Spacing.two, marginTop: Spacing.three },
  noteInput: { minHeight: 96, textAlignVertical: 'top' },
  centered: { textAlign: 'center' },
});
