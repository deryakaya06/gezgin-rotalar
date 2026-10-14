import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { UserProfile } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useFollowCounts } from '@/hooks/use-follow-counts';

const BADGES = [
  { id: 'first', emoji: '🌱', label: 'İlk Adım', min: 1 },
  { id: 'explorer', emoji: '🧭', label: 'Kaşif', min: 5 },
  { id: 'master', emoji: '🏆', label: 'Rota Ustası', min: 10 },
];

/** Profil kartı + puan/check-in/rozet istatistikleri. Kendi profilin ve başkalarınınki için ortak. */
export function ProfileSummary({
  uid,
  profile,
  followRefreshKey,
  children,
}: {
  uid: string | undefined;
  profile: UserProfile | null;
  /** Değiştiğinde takipçi/takip sayıları yeniden hesaplanır. */
  followRefreshKey?: unknown;
  /** Kartın altına eklenecek içerik (ör. email veya takip butonu). */
  children?: ReactNode;
}) {
  const router = useRouter();
  const followCounts = useFollowCounts(uid, followRefreshKey);

  function openList(type: 'followers' | 'following') {
    if (!uid) return;
    router.push({ pathname: '/follows', params: { uid, type, name: profile?.displayName ?? '' } });
  }
  const checkInCount = profile?.visitCount ?? 0;
  const earnedBadges = BADGES.filter((b) => checkInCount >= b.min);

  const stats = [
    { label: 'Toplam Puan', value: profile?.totalPoints ?? 0 },
    { label: 'Check-in', value: checkInCount },
    { label: 'Rozet', value: earnedBadges.length },
  ];

  return (
    <>
      <Card style={styles.card}>
        <ThemedText style={styles.avatarEmoji}>
          {profile?.accountType === 'couple' ? '💑' : '👥'}
        </ThemedText>
        <ThemedText type="defaultSemiBold">{profile?.displayName ?? 'Yükleniyor...'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {profile?.accountType === 'couple' ? 'Çift Hesabı' : 'Arkadaş Hesabı'}
        </ThemedText>
        <View style={styles.followRow}>
          <Pressable
            onPress={() => openList('followers')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${followCounts.followers} takipçi, listeyi aç`}
          >
            <ThemedText type="small" style={styles.followLink}>
              <ThemedText type="smallBold">{followCounts.followers}</ThemedText> takipçi
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => openList('following')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${followCounts.following} takip, listeyi aç`}
          >
            <ThemedText type="small" style={styles.followLink}>
              <ThemedText type="smallBold">{followCounts.following}</ThemedText> takip
            </ThemedText>
          </Pressable>
        </View>
        {children}
      </Card>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <Card key={stat.label} style={styles.statBox}>
            <ThemedText type="subtitle" style={styles.statNumber}>
              {stat.value}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {stat.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      {earnedBadges.length > 0 && (
        <View style={styles.badgeRow}>
          {earnedBadges.map((b) => (
            <View key={b.id} style={styles.badgeItem}>
              <ThemedText style={styles.badgeEmoji}>{b.emoji}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {b.label}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, alignItems: 'center', gap: Spacing.one },
  avatarEmoji: { fontSize: 40, lineHeight: 48, marginBottom: Spacing.two },
  followRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  followLink: { textDecorationLine: 'underline' },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statBox: { flex: 1, alignItems: 'center', borderRadius: Radius.medium },
  statNumber: { fontSize: 22, lineHeight: 30 },
  badgeRow: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  badgeItem: { alignItems: 'center', gap: 2 },
  badgeEmoji: { fontSize: 28, lineHeight: 34 },
});
