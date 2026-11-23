import { useEffect, type ComponentProps } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BackButton } from '@/components/ui/back-button';
import { ContentColumn, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useNotifications, type NotificationItem } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { markNotificationsSeen } from '@/services/notifications';

/** Okunmamışlar ekranda kısa süre vurgulu kalır, sonra okundu olur. */
const MARK_SEEN_DELAY_MS = 1500;

type IconName = ComponentProps<typeof Ionicons>['name'];

function describe(item: NotificationItem): { icon: IconName; title: string; body?: string } {
  if (item.kind === 'announcement') {
    return {
      icon: 'megaphone-outline',
      title: `${item.data.locationName}: ${item.data.title}`,
      body: item.data.body || undefined,
    };
  }
  const { type, actorName, targetName } = item.data;
  if (type === 'follow') return { icon: 'person-add-outline', title: `${actorName} seni takip etmeye başladı.` };
  if (type === 'tag') return { icon: 'pricetag-outline', title: `${actorName} seni ${targetName} check-in'inde etiketledi.` };
  if (type === 'suggestion_approved') {
    return { icon: 'checkmark-circle-outline', title: `"${targetName}" önerin onaylandı ve mekanlara eklendi.` };
  }
  return { icon: 'close-circle-outline', title: `"${targetName}" önerin kabul edilmedi.` };
}

function formatTime(time: number) {
  if (!time) return '...';
  return new Date(time).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const { items, unreadIds, unreadCount, loaded, error } = useNotifications();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid || !loaded || unreadCount === 0) return;
    const timer = setTimeout(() => {
      markNotificationsSeen(uid, unreadIds).catch((e: Error) => {
        console.log('Bildirimler okundu yapılamadı:', e.message);
      });
    }, MARK_SEEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [uid, loaded, unreadCount, unreadIds]);

  function open(item: NotificationItem) {
    if (item.kind === 'announcement') {
      router.push({ pathname: '/location/[id]', params: { id: item.data.locationId } });
    } else if (item.data.type === 'follow' || item.data.type === 'tag') {
      router.push({ pathname: '/user/[id]', params: { id: item.data.actorId } });
    } else {
      router.push('/suggestions');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <BackButton />
              <ThemedText type="subtitle">Bildirimler</ThemedText>
              {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            </View>
          }
          renderItem={({ item }) => {
            const { icon, title, body } = describe(item);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.unread ? `Okunmamış: ${title}` : title}
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.row,
                  item.unread && { backgroundColor: theme.highlightSoft },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={icon} size={20} color={theme.primary} />
                </View>
                <View style={styles.text}>
                  <ThemedText type={item.unread ? 'smallBold' : 'small'}>{title}</ThemedText>
                  {body ? <ThemedText type="small" themeColor="textSecondary">{body}</ThemedText> : null}
                  <ThemedText type="caption" themeColor="textSecondary">{formatTime(item.time)}</ThemedText>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            error ? undefined : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {loaded ? 'Henüz bildirimin yok.' : 'Yükleniyor...'}
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  list: { paddingHorizontal: Spacing.three, paddingTop: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.one },
  header: { gap: Spacing.three, paddingHorizontal: Spacing.one, marginBottom: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  pressed: { opacity: 0.7 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
