import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { blockUser, unblockUser } from '@/services/blocks';
import { confirmAction } from '@/utils/confirm';

/** Başkasının profilindeki Engelle / Engeli Kaldır düğmesi. */
export function BlockButton({
  userId,
  name,
  blocked,
}: {
  userId: string;
  name: string;
  blocked: boolean;
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.uid === userId) return null;
  const me = user.uid;

  async function onPress() {
    if (!blocked) {
      const ok = await confirmAction(
        `${name} engellensin mi?`,
        'Paylaşımlarını görmezsin, birbirinizi takip edemezsiniz ve mevcut takipler kalkar.',
        'Engelle'
      );
      if (!ok) return;
    }
    setBusy(true);
    setError('');
    try {
      await (blocked ? unblockUser(me, userId) : blockUser(me, userId));
    } catch (e) {
      setError('İşlem yapılamadı: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={blocked ? `${name} engelini kaldır` : `${name} kullanıcısını engelle`}
        disabled={busy}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.dimmed]}
      >
        <ThemedText type="smallBold" style={{ color: blocked ? theme.primary : theme.danger }}>
          {blocked ? 'Engeli Kaldır' : 'Engelle'}
        </ThemedText>
      </Pressable>
      {error ? <ThemedText type="caption" style={{ color: theme.danger }}>{error}</ThemedText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: Spacing.two, alignSelf: 'center' },
  dimmed: { opacity: 0.5 },
});
