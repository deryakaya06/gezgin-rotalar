import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { UserProfile, WithId } from '@repo/shared';

import { Avatar } from '@/components/avatar';
import { SettingsPage } from '@/components/settings-ui';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useBlockedUsers } from '@/hooks/use-blocked-users';
import { useTheme } from '@/hooks/use-theme';
import { unblockUser } from '@/services/blocks';
import { fetchUsers } from '@/services/users';

export default function BlockedUsersScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { ids } = useBlockedUsers();
  const [people, setPeople] = useState<WithId<UserProfile>[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchUsers(ids)
      .then((list) => {
        if (!cancelled) setPeople(list);
      })
      .catch((e: Error) => {
        if (!cancelled) setError('Engellenenler yüklenemedi: ' + e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  function unblock(id: string) {
    if (!user) return;
    setError('');
    unblockUser(user.uid, id).catch((e: Error) => setError('Engel kaldırılamadı: ' + e.message));
  }

  return (
    <SettingsPage title="Engellenenler">
      <View style={styles.list}>
        {error ? <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText> : null}
        {people
          .filter((person) => ids.includes(person.id))
          .map((person) => (
            <View key={person.id} style={styles.row}>
              <Avatar photoUrl={person.photoUrl} accountType={person.accountType} size={44} />
              <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.name}>
                {person.displayName}
              </ThemedText>
              <Button title="Engeli Kaldır" variant="outline" size="small" onPress={() => unblock(person.id)} />
            </View>
          ))}
        {ids.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Kimseyi engellemedin.
          </ThemedText>
        ) : null}
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  name: { flex: 1 },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
