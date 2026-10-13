import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pickPhoto, type PickedPhoto } from '@/services/photos';

/** Check-in için tek fotoğraf seçimi: kamera/galeri düğmeleri ya da seçilen fotoğrafın önizlemesi. */
export function PhotoPicker({
  photo,
  onChange,
  disabled,
}: {
  photo: PickedPhoto | null;
  onChange: (photo: PickedPhoto | null) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();

  async function choose(source: 'camera' | 'library') {
    const result = await pickPhoto(source);
    if (result === 'denied') {
      Alert.alert(
        'İzin gerekli',
        source === 'camera'
          ? 'Fotoğraf çekmek için kamera iznini Ayarlar\'dan açabilirsin.'
          : 'Fotoğraf seçmek için galeri iznini Ayarlar\'dan açabilirsin.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    if (result) onChange(result);
  }

  if (photo) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fotoğrafı kaldır"
          disabled={disabled}
          onPress={() => onChange(null)}
          style={[styles.remove, { backgroundColor: theme.background }]}
          hitSlop={8}
        >
          <ThemedText type="smallBold">✕</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.buttons}>
      <Button
        style={styles.button}
        title="📷 Fotoğraf Çek"
        variant="outline"
        disabled={disabled}
        onPress={() => choose('camera')}
      />
      <Button
        style={styles.button}
        title="🖼️ Galeriden Seç"
        variant="outline"
        disabled={disabled}
        onPress={() => choose('library')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: Spacing.two },
  button: { flex: 1, paddingHorizontal: Spacing.two },
  previewWrap: { position: 'relative' },
  preview: { width: '100%', aspectRatio: 1, borderRadius: Radius.medium },
  remove: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
