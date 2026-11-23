// Arama alanı (searchName) olmayan ya da adıyla uyuşmayan kullanıcıları doldurur; böylece
// uygulamaya henüz giriş yapmamış eski hesaplar da kullanıcı aramasında görünür.
// Kullanım (kök dizinden): npm run users:backfill-search   — admin e-posta ve şifre sorulur.
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { openAdminSession } from './lib/admin-session.mjs';

// packages/shared/src/search.ts searchKey ile aynı olmalı.
function searchKey(text) {
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

let session;
try {
  session = await openAdminSession();
  const snapshot = await getDocs(collection(session.db, 'users'));
  const batch = writeBatch(session.db);
  let changed = 0;
  for (const d of snapshot.docs) {
    const { displayName, searchName } = d.data();
    if (typeof displayName !== 'string') continue;
    const expected = searchKey(displayName);
    if (searchName === expected) continue;
    batch.update(doc(session.db, 'users', d.id), { searchName: expected });
    console.log(`- ${displayName} → "${expected}"`);
    changed++;
  }
  if (changed) await batch.commit();
  console.log(`✔ ${snapshot.size} kullanıcıdan ${changed} tanesinin arama alanı güncellendi.`);
} catch (error) {
  console.error('✖', error.code === 'permission-denied' ? 'Yetki yok: hesap admin olmalı ve güncel kurallar yayında olmalı.' : error.message);
  process.exitCode = 1;
} finally {
  await session?.close();
}
