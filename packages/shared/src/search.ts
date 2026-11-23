/**
 * Kullanıcı aramasında kullanılan anahtar: küçük harf, Türkçe karakterler sadeleşmiş,
 * boşluklar tekleşmiş. "Ayşe & Mehmet" → "ayse & mehmet". Firestore metin araması
 * yapamadığı için arama bu alanda "şununla başlayanlar" sorgusuyla yapılır.
 */
export function searchKey(text: string) {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}
