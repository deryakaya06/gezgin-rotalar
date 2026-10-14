import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

import { ProfileSummary } from '@/components/profile-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TileStripe } from '@/components/tile-stripe';
import { Button } from '@/components/ui/button';
import { ContentColumn, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { auth } from '@/firebase';
import { pickPhoto, uploadPhoto } from '@/services/photos';
import { setProfilePhoto } from '@/services/users';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [photoBusy, setPhotoBusy] = useState(false);

  async function changePhoto(source: 'camera' | 'library') {
    if (!user) return;
    const picked = await pickPhoto(source);
    if (picked === 'denied') {
      Alert.alert('İzin gerekli', 'Fotoğraf seçebilmek için Ayarlar\'dan izin vermelisin.');
      return;
    }
    if (!picked) return;
    setPhotoBusy(true);
    try {
      await setProfilePhoto(user.uid, await uploadPhoto(picked));
    } catch (error) {
      Alert.alert('Fotoğraf kaydedilemedi', (error as Error).message);
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto() {
    if (!user) return;
    setProfilePhoto(user.uid, null).catch((error: Error) =>
      Alert.alert('Fotoğraf kaldırılamadı', error.message)
    );
  }

  function handleEditPhoto() {
    // Web'de Alert menüsü yok; doğrudan dosya seçici açılır.
    if (Platform.OS === 'web') {
      changePhoto('library');
      return;
    }
    Alert.alert('Profil fotoğrafı', undefined, [
      { text: 'Fotoğraf çek', onPress: () => changePhoto('camera') },
      { text: 'Galeriden seç', onPress: () => changePhoto('library') },
      ...(profile?.photoUrl
        ? [{ text: 'Fotoğrafı kaldır', style: 'destructive' as const, onPress: removePhoto }]
        : []),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  }

  function handleLogout() {
    // Yönlendirmeyi _layout'taki Stack.Protected yapar.
    signOut(auth);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TileStripe />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Profil</ThemedText>

          <ProfileSummary
            uid={user?.uid}
            profile={profile}
            onEditPhoto={handleEditPhoto}
            photoBusy={photoBusy}
          >
            <ThemedText type="caption" themeColor="textSecondary">
              {user?.email}
            </ThemedText>
          </ProfileSummary>

          <Button title="Lider Tablosunu Gör" onPress={() => router.push('/leaderboard')} />
          <Button title="Çıkış Yap" variant="outline" onPress={handleLogout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { ...ContentColumn, flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
});
