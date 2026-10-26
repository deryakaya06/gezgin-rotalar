import { Alert, Platform } from 'react-native';

/**
 * Silme gibi geri alınamayan işlemler için onay sorar. Web'de React Native'in Alert'i
 * düğme göstermediği için tarayıcının onay kutusu kullanılır.
 */
export function confirmAction(title: string, message: string, confirmText: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
