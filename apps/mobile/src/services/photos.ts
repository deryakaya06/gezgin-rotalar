import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CLOUDINARY } from '@repo/shared';

const MAX_SIDE = 1600;

export const isPhotoUploadConfigured = !!CLOUDINARY.cloudName && !!CLOUDINARY.uploadPreset;

export type PickedPhoto = { uri: string; width: number; height: number };

/**
 * Kameradan veya galeriden tek fotoğraf seçtirir. Kullanıcı vazgeçerse null,
 * izin verilmezse 'denied' döner.
 */
export async function pickPhoto(
  source: 'camera' | 'library'
): Promise<PickedPhoto | null | 'denied'> {
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

  if (result.canceled) return null;
  const { uri, width, height } = result.assets[0];
  return { uri, width, height };
}

/**
 * Uzun kenarı en fazla 1600 px olacak şekilde küçültür, JPEG olarak sıkıştırır
 * ve base64 metin olarak döndürür.
 */
async function shrinkToBase64({ uri, width, height }: PickedPhoto) {
  const context = ImageManipulator.manipulate(uri);
  const longest = Math.max(width, height);
  if (longest > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('base64 üretilemedi');
  return saved.base64;
}

/** Fotoğrafı küçültüp Cloudinary'ye yükler ve herkese açık adresini döndürür. */
export async function uploadPhoto(photo: PickedPhoto): Promise<string> {
  if (!isPhotoUploadConfigured) {
    throw new Error('Fotoğraf yükleme henüz ayarlanmadı (CLOUDINARY).');
  }

  let base64: string;
  try {
    base64 = await shrinkToBase64(photo);
  } catch (error: any) {
    console.log('Fotoğraf küçültülemedi:', error);
    throw new Error('Fotoğraf hazırlanamadı (' + (error?.message ?? error) + ')');
  }

  // Expo'nun fetch'i FormData'da { uri, name, type } dosya nesnesini desteklemiyor
  // ("Unsupported FormDataPart implementation"); Cloudinary data URI'yi JSON içinde kabul ediyor.
  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: `data:image/jpeg;base64,${base64}`,
          upload_preset: CLOUDINARY.uploadPreset,
        }),
      }
    );
  } catch (error: any) {
    console.log('Cloudinary isteği gönderilemedi:', error);
    throw new Error('Sunucuya ulaşılamadı (' + (error?.message ?? error) + ')');
  }

  const text = await response.text();
  if (!response.ok) {
    console.log('Cloudinary hatası:', response.status, text);
    let message = text.slice(0, 200);
    try {
      message = JSON.parse(text)?.error?.message ?? message;
    } catch {}
    throw new Error(`Cloudinary ${response.status}: ${message}`);
  }
  return JSON.parse(text).secure_url as string;
}

/**
 * Cloudinary adresine boyut dönüşümü ekler; liste ve akışta tam boy yerine
 * küçük, otomatik formatlı bir kopya indirilir.
 */
export function photoThumbnail(url: string, size: number) {
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`);
}
