import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { deleteCheckIn } from '@/services/checkins';
import { confirmAction } from '@/utils/confirm';

/** Kendi check-in'ini silme düğmesi; onaydan sonra puanı da geri alır. */
export function DeleteCheckInButton({
  checkIn,
  onDeleted,
}: {
  checkIn: { id: string; userId: string; points?: number; locationName: string };
  onDeleted?: () => void;
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  if (!user || user.uid !== checkIn.userId) return null;

  async function onPress() {
    const points = checkIn.points ?? 0;
    const ok = await confirmAction(
      'Check-in silinsin mi?',
      `${checkIn.locationName} check-in'i silinecek.` +
        (points > 0 ? ` Kazandığın ${points} puan geri alınacak.` : ''),
      'Sil'
    );
    if (!ok || !user) return;
    setBusy(true);
    try {
      await deleteCheckIn(user.uid, checkIn);
      onDeleted?.();
    } catch (error) {
      Alert.alert('Check-in silinemedi', (error as Error).message);
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`${checkIn.locationName} check-in'ini sil`}
      style={({ pressed }) => [styles.button, (pressed || busy) && styles.dimmed]}
    >
      <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4 },
  dimmed: { opacity: 0.5 },
});
