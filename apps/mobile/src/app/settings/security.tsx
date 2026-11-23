import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';

import { SettingsPage, SettingsRow, SettingsSection } from '@/components/settings-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { auth } from '@/firebase';

export default function SecurityScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function resetPassword() {
    if (!user?.email || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage(`Şifre sıfırlama bağlantısı ${user.email} adresine gönderildi.`);
    } catch (e) {
      setMessage('E-posta gönderilemedi: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage title="Şifre ve güvenlik">
      <SettingsSection title="Giriş bilgileri">
        <SettingsRow icon="mail-outline" label="E-posta" value={user?.email ?? '—'} />
        <SettingsRow icon="key-outline" label="Şifreyi değiştir" onPress={resetPassword} />
      </SettingsSection>
      <View style={styles.note}>
        <ThemedText type="small" themeColor="textSecondary">
          Şifreni değiştirmek için e-posta adresine bir bağlantı göndeririz.
        </ThemedText>
        {message ? <ThemedText type="small">{message}</ThemedText> : null}
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  note: { padding: Spacing.three, gap: Spacing.two },
});
