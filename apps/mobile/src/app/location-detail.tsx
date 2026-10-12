import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { DUPLICATE_CHECKIN_WINDOW_HOURS, POINTS_PER_CHECKIN } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { auth } from '@/firebase';
import { createCheckIn } from '@/services/checkins';

export default function LocationDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    description: string;
  }>();

  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function handleCheckIn() {
    const user = auth.currentUser;

    if (!user) {
      setMessage('Giriş yapılmamış görünüyor.');
      return;
    }

    setSaving(true);
    setMessage('');

    createCheckIn(user.uid, { id: params.id, name: params.name }, note.trim())
      .then((points) => {
        setMessage(
          points > 0
            ? `Check-in başarılı! +${points} puan kazandın.`
            : `Check-in kaydedildi. Bu mekana son ${DUPLICATE_CHECKIN_WINDOW_HOURS} saatte zaten check-in yaptığın için puan verilmedi.`
        );
        setNote('');
      })
      .catch((error) => {
        setMessage('Hata: ' + error.message);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton />

          <ThemedText type="subtitle">{params.name}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            {params.description}
          </ThemedText>

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
            style={styles.button}
            title={saving ? 'Kaydediliyor...' : `Check-in Yap (+${POINTS_PER_CHECKIN} Puan)`}
            onPress={handleCheckIn}
            disabled={saving}
          />

          {message ? (
            <ThemedText type="small" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  description: { marginBottom: Spacing.three },
  noteInput: { minHeight: 96, textAlignVertical: 'top' },
  button: { marginTop: Spacing.three },
  message: { textAlign: 'center', marginTop: Spacing.three },
});
