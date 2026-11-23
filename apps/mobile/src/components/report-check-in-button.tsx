import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { REPORT_REASONS, type ReportReason } from '@repo/shared';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { reportCheckIn } from '@/services/reports';

const REASONS = Object.entries(REPORT_REASONS) as [ReportReason, string][];

/** Başkasının paylaşımını şikâyet etme düğmesi; neden seçimi web'de de çalışan bir pencerede. */
export function ReportCheckInButton({ checkIn }: { checkIn: { id: string; userId: string; locationName: string } }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!user || user.uid === checkIn.userId) return null;

  async function send(reason: ReportReason) {
    if (!user) return;
    setBusy(true);
    setMessage('');
    try {
      await reportCheckIn(user.uid, checkIn.id, reason);
      setSent(true);
      setMessage('Şikâyetin alındı. Yönetici inceleyecek.');
    } catch {
      // Kurallar ikinci şikâyeti de reddeder; istemci önceki şikâyeti okuyamaz.
      setMessage('Şikâyet gönderilemedi. Bu paylaşımı daha önce şikâyet etmiş olabilirsin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`${checkIn.locationName} paylaşımını şikâyet et`}
        style={({ pressed }) => [styles.icon, pressed && styles.dimmed]}
      >
        <Ionicons name={sent ? 'flag' : 'flag-outline'} size={18} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <ThemedText type="heading">Paylaşımı şikâyet et</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {checkIn.locationName}
            </ThemedText>
            {!sent
              ? REASONS.map(([reason, label]) => (
                  <Button
                    key={reason}
                    title={label}
                    variant="outline"
                    disabled={busy}
                    onPress={() => send(reason)}
                  />
                ))
              : null}
            {message ? <ThemedText type="small">{message}</ThemedText> : null}
            <Button title="Kapat" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  icon: { padding: 4 },
  dimmed: { opacity: 0.5 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.large,
  },
});
