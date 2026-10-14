import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';

export function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Geri"
      hitSlop={12}
      // Sayfa doğrudan açıldıysa (web'de adres çubuğundan/yenileyerek) geri gidilecek
      // ekran yoktur; o zaman ana sekmelere dönülür.
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
      style={{ alignSelf: 'flex-start' }}
    >
      <ThemedText type="linkPrimary">{'‹ Geri'}</ThemedText>
    </Pressable>
  );
}
