import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';

/** Akış başlığındaki zil; okunmamış bildirim sayısını rozetle gösterir. */
export function NotificationBell() {
  const router = useRouter();
  const theme = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={unreadCount ? `Bildirimler, ${unreadCount} okunmamış` : 'Bildirimler'}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={unreadCount ? 'notifications' : 'notifications-outline'} size={20} color={theme.text} />
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.background }]}>
          <ThemedText style={[styles.badgeText, { color: theme.surface }]}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 13, fontWeight: 800 },
});
