import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import { Image } from 'expo-image';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { photoThumbnail } from '@/services/photos';

/** Check-in fotoğrafı; Cloudinary'den istenen boyutta kare kopyasını indirir. */
export function CheckInPhoto({
  url,
  size = 800,
  style,
}: {
  url: string;
  /** İndirilecek kopyanın kenar uzunluğu (px). */
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const theme = useTheme();
  return (
    <Image
      source={{ uri: photoThumbnail(url, size) }}
      style={[styles.photo, { backgroundColor: theme.backgroundElement }, style]}
      contentFit="cover"
      transition={200}
      accessibilityLabel="Check-in fotoğrafı"
    />
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 1, borderRadius: Radius.medium },
});
