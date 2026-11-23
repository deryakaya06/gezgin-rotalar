import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LOCATION_CATEGORIES } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useScrollToInput } from '@/hooks/use-scroll-to-input';
import { useTheme } from '@/hooks/use-theme';
import { createSuggestion } from '@/services/suggestions';

export default function SuggestLocationScreen() {
  const { user, profile } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const { scrollRef, inputProps } = useScrollToInput();
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const cleanName = name.trim();
    const cleanDistrict = district.trim();
    if (cleanName.length < 2) return setError('Mekanın adını yaz.');
    if (cleanDistrict.length < 2) return setError('Mekanın ilçesini yaz.');
    if (!category) return setError('Bir kategori seç.');
    if (!user || !profile) return;
    setSaving(true);
    setError('');
    try {
      await createSuggestion(user.uid, profile.displayName, {
        name: cleanName,
        district: cleanDistrict,
        category,
        description: description.trim(),
      });
      if (router.canGoBack()) router.back();
      else router.replace('/suggestions');
    } catch (e) {
      setError('Öneri gönderilemedi: ' + (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* iOS'ta klavye boşluğunu ScrollView kendisi ayarlar; ikisi birlikte çakışır. */}
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'android' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <BackButton />
            <ThemedText type="subtitle">Yeni Mekan Öner</ThemedText>

            <TextField placeholder="Mekan adı (ör. Kuzguncuk Bostanı)" value={name} onChangeText={setName} maxLength={80} />
            <TextField placeholder="İlçe (ör. Üsküdar)" value={district} onChangeText={setDistrict} maxLength={40} />

            <ThemedText type="smallBold">Kategori</ThemedText>
            <View style={styles.chips}>
              {LOCATION_CATEGORIES.map((item) => (
                <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
              ))}
            </View>

            <TextField
              placeholder="Burayı neden öneriyorsun? (isteğe bağlı)"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              style={styles.description}
              {...inputProps}
            />

            {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            <Button title={saving ? 'Gönderiliyor...' : 'Öneriyi Gönder'} disabled={saving} onPress={save} />
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  description: { minHeight: 96, textAlignVertical: 'top' },
});
