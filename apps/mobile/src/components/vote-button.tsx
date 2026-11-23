import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { hasVoted, setVote } from '@/services/suggestions';

/**
 * Öneriye oy düğmesi. Sayı canlı dinlenen belgeden gelir; oy durumu dokununca hemen
 * değişir, yazma başarısız olursa eski hale döner. disabled: kişinin kendi önerisi.
 */
export function VoteButton({
  suggestionId,
  count,
  disabled,
  onError,
}: {
  suggestionId: string;
  count: number;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  // Oy durumu okunana kadar dokunuş beklemeye alınır; okuma başarısız olsa da düğme kilitlenmez.
  const loaded = useRef(false);

  useEffect(() => {
    if (!user || disabled) return;
    let cancelled = false;
    hasVoted(user.uid, suggestionId)
      .then((value) => {
        if (!cancelled) setVoted(value);
      })
      .catch((error) => {
        console.log('Oy durumu okunamadı:', error.message);
      })
      .finally(() => {
        loaded.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [user, suggestionId, disabled]);

  function toggle() {
    if (!user || busy || disabled || !loaded.current) return;
    const next = !voted;
    setVoted(next);
    setBusy(true);
    setVote(user.uid, suggestionId, next)
      .catch((error) => {
        setVoted(!next);
        onError('Oy kaydedilemedi: ' + error.message);
      })
      .finally(() => setBusy(false));
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: voted, disabled: !!disabled }}
      accessibilityLabel={voted ? `Oyunu geri al, ${count} oy` : `Oy ver, ${count} oy`}
      onPress={toggle}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: voted ? theme.primary : theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={voted ? 'arrow-up' : 'arrow-up-outline'} size={18} color={voted ? theme.onPrimary : theme.textSecondary} />
      <ThemedText type="smallBold" style={{ color: voted ? theme.onPrimary : theme.textSecondary }}>
        {count}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
  },
  pressed: { opacity: 0.7 },
});
