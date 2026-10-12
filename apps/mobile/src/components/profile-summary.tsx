import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { UserProfile } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useFollowCounts } from '@/hooks/use-follow-counts';

const COLORS = { border: '#E2E8F0' };

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
  const followCounts = useFollowCounts(uid, followRefreshKey);
  const checkInCount = profile?.visitCount ?? 0;
  const earnedBadges = BADGES.filter((b) => checkInCount >= b.min);

  return (
    <>
      <ThemedView style={styles.card}>
        <ThemedText style={styles.avatarEmoji}>
          {profile?.accountType === 'couple' ? '💑' : '👥'}
        </ThemedText>
        <ThemedText type="defaultSemiBold">
          {profile?.displayName ?? 'Yükleniyor...'}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {profile?.accountType === 'couple' ? 'Çift Hesabı' : 'Arkadaş Hesabı'}
        </ThemedText>
        <ThemedView style={styles.followRow}>
          <ThemedText style={styles.followText}>
            <ThemedText type="smallBold">{followCounts.followers}</ThemedText> takipçi
          </ThemedText>
          <ThemedText style={styles.followText}>
            <ThemedText type="smallBold">{followCounts.following}</ThemedText> takip
          </ThemedText>
        </ThemedView>
        {children}
      </ThemedView>

      <ThemedView style={styles.statsRow}>
        <ThemedView style={styles.statBox}>
          <ThemedText type="title" style={styles.statNumber}>
            {profile?.totalPoints ?? 0}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Toplam Puan</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statBox}>
          <ThemedText type="title" style={styles.statNumber}>
            {checkInCount}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Check-in</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statBox}>
          <ThemedText type="title" style={styles.statNumber}>
            {earnedBadges.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Rozet</ThemedText>
        </ThemedView>
      </ThemedView>

      {earnedBadges.length > 0 && (
        <ThemedView style={styles.badgeRow}>
          {earnedBadges.map((b) => (
            <ThemedView key={b.id} style={styles.badgeItem}>
              <ThemedText style={styles.badgeEmoji}>{b.emoji}</ThemedText>
              <ThemedText style={styles.badgeLabel}>{b.label}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 4,
  },
  avatarEmoji: { fontSize: 40, marginBottom: 8 },
  subtitle: { color: '#94A3B8' },
  followRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  followText: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20 },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  badgeRow: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  badgeItem: { alignItems: 'center', gap: 2 },
  badgeEmoji: { fontSize: 28 },
  badgeLabel: { fontSize: 11, color: '#94A3B8' },
});
