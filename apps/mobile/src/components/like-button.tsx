import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
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
  const scale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

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
    if (next) {
      // Beğenince kalp kısa bir an büyüyüp yerine oturur.
      scale.set(withSequence(withTiming(1.3, { duration: 120 }), withSpring(1, { damping: 8 })));
    }
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
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Animated.View style={heartStyle}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={22}
          color={liked ? theme.highlight : theme.textSecondary}
        />
      </Animated.View>
      <ThemedText type="smallBold" themeColor={liked ? undefined : 'textSecondary'}>
        {count}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  pressed: { opacity: 0.6 },
});
