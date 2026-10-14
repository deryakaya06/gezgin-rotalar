import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { db } from '@/firebase';
import { useTheme } from '@/hooks/use-theme';
import { likeCheckIn, unlikeCheckIn } from '@/services/likes';

/**
 * Kalp düğmesi ve beğeni sayısı. Dokununca hemen değişir (iyimser güncelleme);
 * yazma başarısız olursa eski hale döner.
 */
export function LikeButton({ checkInId, initialCount }: { checkInId: string; initialCount: number }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDoc(doc(db, COLLECTIONS.checkIns, checkInId, 'likes', user.uid))
      .then((snap) => {
        if (!cancelled) {
          setLiked(snap.exists());
          loaded.current = true;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, checkInId]);

  function toggle() {
    if (!user || busy || !loaded.current) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setBusy(true);
    (next ? likeCheckIn : unlikeCheckIn)(user.uid, checkInId)
      .catch((error) => {
        console.log('Beğeni kaydedilemedi:', error.message);
        setLiked(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      })
      .finally(() => setBusy(false));
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: liked }}
      accessibilityLabel={liked ? 'Beğeniyi geri al' : 'Beğen'}
      onPress={toggle}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: liked ? theme.highlightSoft : theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText style={[styles.heart, { color: liked ? theme.highlight : theme.textSecondary }]}>
        {liked ? '♥' : '♡'}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: liked ? theme.highlight : theme.textSecondary }}>
        {count}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  heart: { fontSize: 16, lineHeight: 20 },
  pressed: { opacity: 0.7 },
});
