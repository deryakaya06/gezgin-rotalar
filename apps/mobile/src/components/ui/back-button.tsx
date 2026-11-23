import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { OnPhoto } from '@/constants/theme';

/**
 * Geri düğmesi. floating: fotoğrafın üstünde duran yuvarlak düğme (mekan detayı kapağı).
 * Sayfa doğrudan açıldıysa (web'de adres çubuğundan/yenileyerek) geri gidilecek ekran
 * yoktur; o zaman ana sekmelere dönülür.
 */
export function BackButton({ floating }: { floating?: boolean }) {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (floating) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geri"
        hitSlop={8}
        onPress={goBack}
        style={({ pressed }) => [styles.floating, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={OnPhoto.badgeText} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Geri"
      hitSlop={12}
      onPress={goBack}
      style={styles.inline}
    >
      <ThemedText type="linkPrimary">{'‹ Geri'}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  floating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OnPhoto.badge,
  },
  pressed: { opacity: 0.7 },
});
