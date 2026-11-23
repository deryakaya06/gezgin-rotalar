import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Liste öğesini aşağıdan süzülerek getirir; sıradaki öğeler kısa aralıklarla gecikir.
 * Yalnızca ilk görünüşte oynar; telefonun "Hareketi Azalt" ayarına uyar.
 */
export function FadeInItem({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380)
        .delay(Math.min(index, 8) * 60)
        .reduceMotion(ReduceMotion.System)}
    >
      {children}
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Basılınca hafifçe küçülüp yaylanarak geri dönen Pressable. */
export function PressableScale({
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animated]}
      onPressIn={(e) => {
        scale.set(withSpring(0.97, { damping: 18, stiffness: 320 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
