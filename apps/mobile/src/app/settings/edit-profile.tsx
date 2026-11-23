import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { AccountType, UserProfile } from '@repo/shared';

import { Avatar } from '@/components/avatar';
import { SettingsPage } from '@/components/settings-ui';
import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useProfilePhoto } from '@/hooks/use-profile-photo';
import { useTheme } from '@/hooks/use-theme';
import { updateUserProfile } from '@/services/users';

export default function EditProfileScreen() {
  const { user, profile } = useAuth();
  if (!user || !profile) return <SettingsPage title="Profili düzenle">{null}</SettingsPage>;
  return <EditProfileForm uid={user.uid} profile={profile} />;
}

function EditProfileForm({ uid, profile }: { uid: string; profile: UserProfile }) {
  const theme = useTheme();
  const router = useRouter();
  const { photoBusy, editPhoto } = useProfilePhoto();
  const [name, setName] = useState(profile.displayName);
  const [accountType, setAccountType] = useState<AccountType>(profile.accountType);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cleanName = name.trim();
  const changed = cleanName !== profile.displayName || accountType !== profile.accountType;
  const canSave = changed && !saving;

  async function save() {
    if (cleanName.length < 2) return setError('Görünen ad en az 2 karakter olmalı.');
    setSaving(true);
    setError('');
    try {
      await updateUserProfile(uid, { displayName: cleanName, accountType });
      if (router.canGoBack()) router.back();
      else router.replace('/settings');
    } catch (e) {
      setError('Profil kaydedilemedi: ' + (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <SettingsPage
      title="Profili düzenle"
      right={
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} hitSlop={10} onPress={save}>
          <ThemedText type="smallBold" style={{ color: canSave ? theme.primary : theme.placeholder }}>
            {saving ? '...' : 'Kaydet'}
          </ThemedText>
        </Pressable>
      }
    >
      <View style={styles.photo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profil fotoğrafını değiştir"
          disabled={photoBusy}
          onPress={editPhoto}
          style={({ pressed }) => [styles.photoButton, (pressed || photoBusy) && styles.dimmed]}
        >
          <Avatar photoUrl={profile.photoUrl} accountType={profile.accountType} size={88} />
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            {photoBusy ? 'Yükleniyor...' : 'Fotoğrafı düzenle'}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <ThemedText type="caption" themeColor="textSecondary">Görünen ad</ThemedText>
          <TextField value={name} onChangeText={setName} maxLength={40} placeholder="Görünen ad" />
        </View>
        <View style={styles.field}>
          <ThemedText type="caption" themeColor="textSecondary">Hesap türü</ThemedText>
          <View style={styles.chips}>
            <Chip label="💑 Çift" selected={accountType === 'couple'} onPress={() => setAccountType('couple')} />
            <Chip label="👥 Arkadaşlar" selected={accountType === 'friends'} onPress={() => setAccountType('friends')} />
          </View>
        </View>
        {error ? <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText> : null}
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', paddingVertical: Spacing.four },
  photoButton: { alignItems: 'center', gap: Spacing.two },
  dimmed: { opacity: 0.6 },
  form: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  field: { gap: Spacing.one },
  chips: { flexDirection: 'row', gap: Spacing.two },
});
