import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, db } from '@/firebase';

const COLORS = { primary: '#FF5733', border: '#E2E8F0', tertiary: '#0D9488' };
const POINTS_PER_CHECKIN = 10;

type Location = {
  id: string;
  name: string;
  description: string;
};

export default function CreateScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getDocs(collection(db, 'locations'))
      .then((snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Location[];
        setLocations(items);
      })
      .catch((error) => {
        console.log('Mekanlar yuklenemedi:', error.message);
      })
      .finally(() => {
        setLoadingLocations(false);
      });
  }, []);

  function handleCheckIn() {
    if (!currentUser) {
      setMessage('Giris yapilmamis gorunuyor. Lutfen tekrar giris yap.');
      return;
    }

    if (!selectedLocation) {
      setMessage('Lutfen bir mekan sec.');
      return;
    }

    setSaving(true);
    setMessage('');

    addDoc(collection(db, 'check_ins'), {
      userId: currentUser.uid,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      note: note.trim(),
      points: POINTS_PER_CHECKIN,
      createdAt: serverTimestamp(),
    })
      .then(() => {
        return updateDoc(doc(db, 'users', currentUser.uid), {
          points: increment(POINTS_PER_CHECKIN),
        });
      })
      .then(() => {
        setMessage('Check-in basarili! +' + POINTS_PER_CHECKIN + ' puan kazandin.');
        setSelectedLocation(null);
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
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ThemedText type="title" style={styles.title}>
                Check-in Yap
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Bir mekan sec, check-in yap, puan kazan.
              </ThemedText>
              <ThemedText style={styles.label}>Mekan Sec</ThemedText>
              {loadingLocations ? (
                <ThemedText style={styles.subtitle}>Mekanlar yukleniyor...</ThemedText>
              ) : null}
            </>
          }
          renderItem={({ item }) => {
            const isSelected = selectedLocation?.id === item.id;
            return (
              <Pressable
                onPress={() => setSelectedLocation(item)}
                style={[
                  styles.locationCard,
                  isSelected && styles.locationCardSelected,
                ]}
              >
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.locationDescription}>
                  {item.description}
                </ThemedText>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <>
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

              {message ? (
                <ThemedText style={styles.message}>{message}</ThemedText>
              ) : null}
            </>
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
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  title: {},
  subtitle: { color: '#94A3B8', marginBottom: Spacing.two },
  label: { fontSize: 13, fontWeight: '600', marginTop: Spacing.two, marginBottom: Spacing.two },
  locationCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
  },
  locationCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#FFF1EC',
  },
  locationDescription: { fontSize: 12, color: '#94A3B8' },
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