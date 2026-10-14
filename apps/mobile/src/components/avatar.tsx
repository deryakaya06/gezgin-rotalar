import { StyleSheet, useColorScheme, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { AccountType } from '@repo/shared';

import { useTheme } from '@/hooks/use-theme';
import { photoThumbnail } from '@/services/photos';

/**
 * Profil fotoğrafı; yoksa Instagram'daki gibi gri daire içinde sade bir siluet.
 * accountType şimdilik yalnızca erişilebilirlik etiketinde kullanılır.
 */
export function Avatar({
  photoUrl,
  accountType,
  size,
}: {
  photoUrl?: string;
  accountType?: AccountType;
  size: number;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const label = accountType === 'couple' ? 'Çift hesabı' : 'Arkadaş grubu';

  if (photoUrl) {
    return (
      <Image
        // Retina ekranlar için iki katı çözünürlükte, kare kırpılmış kopya.
        source={{ uri: photoThumbnail(photoUrl, size * 2) }}
        style={[shape, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`${label} profil fotoğrafı`}
      />
    );
  }

  return (
    <View
      style={[styles.fallback, shape, { backgroundColor: theme.backgroundSelected }]}
      accessibilityLabel={`${label}, profil fotoğrafı yok`}
    >
      {/* Siluet biraz aşağıda durur; omuzlar dairenin kenarında kesilir. */}
      <Ionicons
        name="person"
        size={size * 0.8}
        color={scheme === 'dark' ? theme.placeholder : theme.background}
        style={{ marginTop: size * 0.28 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', overflow: 'hidden' },
});
