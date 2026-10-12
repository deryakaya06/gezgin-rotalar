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
      onPress={() => router.back()}
      style={{ alignSelf: 'flex-start' }}
    >
      <ThemedText type="linkPrimary">{'‹ Geri'}</ThemedText>
    </Pressable>
  );
}
