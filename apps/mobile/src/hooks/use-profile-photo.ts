import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/context/auth';
import { pickPhoto, uploadPhoto } from '@/services/photos';
import { setProfilePhoto } from '@/services/users';

/** Profil fotoğrafını çekme, seçme ve kaldırma menüsü. */
export function useProfilePhoto() {
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

  function editPhoto() {
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

  return { photoBusy, editPhoto };
}
