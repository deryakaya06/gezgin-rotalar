import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useFollow } from '@/hooks/use-follow';

const COLORS = { primary: '#FF5733' };

export function FollowButton({ userId, large }: { userId: string; large?: boolean }) {
  const { isFollowing, busy, toggle, isSelf } = useFollow(userId);
  if (isSelf) return null;

  return (
    <Pressable
      style={[
        styles.button,
        large && styles.buttonLarge,
        isFollowing && styles.buttonActive,
        busy && styles.buttonBusy,
      ]}
      onPress={toggle}
      disabled={busy}
    >
      <ThemedText style={[styles.text, isFollowing && styles.textActive]}>
        {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  buttonLarge: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonActive: { backgroundColor: COLORS.primary },
  buttonBusy: { opacity: 0.6 },
  text: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  textActive: { color: '#fff' },
});
