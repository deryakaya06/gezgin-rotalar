import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { UserProfile, WithId } from '@repo/shared';

import { FollowButton } from '@/components/follow-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

/** Arama sonuçları ve takipçi/takip listelerindeki kullanıcı satırı. */
export function UserRow({ user }: { user: WithId<UserProfile> }) {
  const router = useRouter();
  const theme = useTheme();
  const { user: me } = useAuth();
  const isMe = user.id === me?.uid;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { borderColor: theme.border }, pressed && styles.pressed]}
      onPress={() =>
        isMe
          ? router.navigate('/(tabs)/profile')
          : router.push({ pathname: '/user/[id]', params: { id: user.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${user.displayName} profilini aç`}
    >
      <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.avatarEmoji}>{user.accountType === 'couple' ? '💑' : '👥'}</ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {user.displayName} {isMe ? '(Sen)' : ''}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {user.accountType === 'couple' ? 'Çift' : 'Arkadaş Grubu'} · {user.totalPoints ?? 0} puan
        </ThemedText>
      </View>
      <FollowButton userId={user.id} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
  },
  pressed: { opacity: 0.7 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 20, lineHeight: 26 },
  text: { flex: 1, gap: 2 },
});
