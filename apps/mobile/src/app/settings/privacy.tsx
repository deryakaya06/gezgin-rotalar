import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SettingsPage, SettingsRow, SettingsSection } from '@/components/settings-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBlockedUsers } from '@/hooks/use-blocked-users';

export default function PrivacyScreen() {
  const router = useRouter();
  const { ids } = useBlockedUsers();

  return (
    <SettingsPage title="Gizlilik">
      <SettingsSection title="Kimler görebilir">
        <SettingsRow icon="person-outline" label="Profilin" value="Tüm üyeler" />
        <SettingsRow icon="images-outline" label="Paylaşımların" value="Tüm üyeler" />
        <SettingsRow icon="calendar-outline" label="Gezi planların" value="Yalnızca sen" />
        <SettingsRow icon="mail-outline" label="E-posta adresin" value="Yalnızca sen" />
      </SettingsSection>
      <SettingsSection title="Bağlantılar">
        <SettingsRow
          icon="ban-outline"
          label="Engellenenler"
          value={ids.length ? String(ids.length) : undefined}
          onPress={() => router.push('/settings/blocked')}
        />
      </SettingsSection>
      <View style={styles.note}>
        <ThemedText type="small" themeColor="textSecondary">
          Engellediğin kişinin paylaşımlarını görmezsin ve birbirinizi takip edemezsiniz. Karşı taraf engellendiğini
          görmez, ancak profilini görmeye devam edebilir.
        </ThemedText>
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  note: { padding: Spacing.three },
});
