import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CLOUDINARY } from '@repo/shared';

const MAX_SIDE = 1600;

export const isPhotoUploadConfigured = !!CLOUDINARY.cloudName && !!CLOUDINARY.uploadPreset;

/**
 * Kameradan veya galeriden tek fotoğraf seçtirir. İzin verilmezse veya kullanıcı
 * vazgeçerse null döner; izin reddi için 'denied' döner.
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null | 'denied'> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return 'denied';

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  return result.canceled ? null : result.assets[0].uri;
}

/** Uzun kenarı en fazla 1600 px olacak şekilde küçültür ve JPEG olarak sıkıştırır. */
async function shrink(uri: string) {
  const context = ImageManipulator.manipulate(uri);
  const original = await context.renderAsync();
  const scale = Math.min(1, MAX_SIDE / Math.max(original.width, original.height));
  if (scale < 1) {
    context.resize({ width: Math.round(original.width * scale) });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return saved.uri;
}

/** Fotoğrafı küçültüp Cloudinary'ye yükler ve herkese açık adresini döndürür. */
export async function uploadPhoto(uri: string): Promise<string> {
  if (!isPhotoUploadConfigured) {
    throw new Error('Fotoğraf yükleme henüz ayarlanmadı (CLOUDINARY).');
  }

  const body = new FormData();
  // React Native'de dosya, { uri, name, type } nesnesi olarak eklenir.
  body.append('file', { uri: await shrink(uri), name: 'check-in.jpg', type: 'image/jpeg' } as any);
  body.append('upload_preset', CLOUDINARY.uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
    { method: 'POST', body }
  );
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Fotoğraf yüklenemedi.');
  }
  return json.secure_url as string;
}

/**
 * Cloudinary adresine boyut dönüşümü ekler; liste ve akışta tam boy yerine
 * küçük, otomatik formatlı bir kopya indirilir.
 */
export function photoThumbnail(url: string, size: number) {
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`);
}
