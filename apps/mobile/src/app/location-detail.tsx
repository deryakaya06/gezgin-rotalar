import { useState } from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0' };
const POINTS_PER_CHECKIN = 10;

export default function LocationDetailScreen() {
  const router = useRouter();
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
      setMessage('Giris yapilmamis gorunuyor.');
      return;
    }

    setSaving(true);
    setMessage('');

    addDoc(collection(db, 'check_ins'), {
      userId: user.uid,
      locationId: params.id,
      locationName: params.name,
      note: note.trim(),
      points: POINTS_PER_CHECKIN,
      createdAt: serverTimestamp(),
    })
      .then(() => {
        return updateDoc(doc(db, 'users', user.uid), {
          points: increment(POINTS_PER_CHECKIN),
        });
      })
      .then(() => {
        setMessage('Check-in basarili! +' + POINTS_PER_CHECKIN + ' puan kazandin.');
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
        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.backText}>{'< Geri'}</ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          {params.name}
        </ThemedText>
        <ThemedText style={styles.description}>{params.description}</ThemedText>

        <ThemedText style={styles.label}>Not (opsiyonel)</ThemedText>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Bu mekanda neler yasadin?"
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleCheckIn}
          disabled={saving}
        >
          <ThemedText style={styles.buttonText}>
            {saving ? 'Kaydediliyor...' : 'Check-in Yap (+10 Puan)'}
          </ThemedText>
        </Pressable>

        {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}
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
    gap: Spacing.two,
  },
  backText: { color: COLORS.primary, fontWeight: '600', marginBottom: Spacing.two },
  title: {},
  description: { color: '#94A3B8', marginBottom: Spacing.three },
  label: { fontSize: 13, fontWeight: '600', marginTop: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  message: { textAlign: 'center', marginTop: Spacing.three },
});