import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { AccountType } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { photoThumbnail } from '@/services/photos';

/** Profil fotoğrafı; yoksa hesap türüne göre 💑 / 👥 gösterir. */
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
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return (
      <Image
        // Retina ekranlar için iki katı çözünürlükte, kare kırpılmış kopya.
        source={{ uri: photoThumbnail(photoUrl, size * 2) }}
        style={[shape, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={150}
        accessibilityLabel="Profil fotoğrafı"
      />
    );
  }

  return (
    <View style={[styles.fallback, shape, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={{ fontSize: size * 0.48, lineHeight: size * 0.62 }}>
        {accountType === 'couple' ? '💑' : '👥'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
