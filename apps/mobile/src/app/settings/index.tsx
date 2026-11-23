import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

import { Avatar } from '@/components/avatar';
import { SettingsPage, SettingsRow, SettingsSection } from '@/components/settings-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { auth } from '@/firebase';
import { useBlockedUsers } from '@/hooks/use-blocked-users';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/utils/confirm';

export default function SettingsScreen() {
  const { user, profile } = useAuth();
  const theme = useTheme();
  const scheme = useColorScheme();
  const router = useRouter();
  const { ids: blockedIds } = useBlockedUsers();

  async function logout() {
    const ok = await confirmAction('Çıkış yapılsın mı?', `${user?.email ?? 'Hesabın'} oturumu kapatılacak.`, 'Çıkış Yap');
    // Yönlendirmeyi _layout'taki Stack.Protected yapar.
    if (ok) signOut(auth);
  }

  return (
    <SettingsPage title="Ayarlar ve gizlilik">
      <SettingsSection>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profili düzenle"
          onPress={() => router.push('/settings/edit-profile')}
          style={({ pressed }) => [styles.account, pressed && { backgroundColor: theme.backgroundElement }]}
        >
          <Avatar photoUrl={profile?.photoUrl} accountType={profile?.accountType} size={56} />
          <View style={styles.accountText}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>{profile?.displayName ?? '...'}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>{user?.email}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.placeholder} />
        </Pressable>
      </SettingsSection>

      <SettingsSection title="Hesabın">
        <SettingsRow icon="person-circle-outline" label="Profili düzenle" onPress={() => router.push('/settings/edit-profile')} />
        <SettingsRow icon="shield-checkmark-outline" label="Şifre ve güvenlik" onPress={() => router.push('/settings/security')} />
      </SettingsSection>

      <SettingsSection title="Kimler görebilir">
        <SettingsRow icon="lock-closed-outline" label="Gizlilik" onPress={() => router.push('/settings/privacy')} />
        <SettingsRow
          icon="ban-outline"
          label="Engellenenler"
          value={blockedIds.length ? String(blockedIds.length) : undefined}
          onPress={() => router.push('/settings/blocked')}
        />
      </SettingsSection>

      <SettingsSection title="Uygulama">
        <SettingsRow
          icon={scheme === 'dark' ? 'moon-outline' : 'sunny-outline'}
          label="Görünüm"
          value={`${scheme === 'dark' ? 'Koyu' : 'Açık'} (cihaz ayarı)`}
        />
        <SettingsRow icon="information-circle-outline" label="Sürüm" value={Constants.expoConfig?.version ?? '—'} />
      </SettingsSection>

      <SettingsSection title="Giriş">
        <SettingsRow icon="log-out-outline" label="Çıkış yap" danger onPress={logout} />
      </SettingsSection>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  accountText: { flex: 1 },
});
