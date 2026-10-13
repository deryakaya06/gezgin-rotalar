// Firestore'daki mekanlardan konum/ilçe gibi alanları eksik olanları listeler ve
// scripts/locations.json'daki bir mekanla aynı ada sahip olanları (kopyaları) işaretler.
//
// Kullanım (kök dizinden):
//   npm run locations:audit                          # yalnızca listeler
//   npm run locations:audit -- --delete <id> <id>    # listelenen eksik kayıtlardan verilenleri siler
// E-posta ve şifre sorulur.
import { readFile } from 'node:fs/promises';

import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';

import { openAdminSession } from './lib/admin-session.mjs';

const args = process.argv.slice(2);
const deleteIds = args[0] === '--delete' ? new Set(args.slice(1)) : new Set();

const seeded = JSON.parse(await readFile(new URL('./locations.json', import.meta.url), 'utf8'));
// Türkçe karakterleri sadeleştirir: "Kadıköy Çarşı" ile "Kadikoy Carsi" eşleşir.
const normalize = (s = '') =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/\s+/g, ' ')
    .trim();
const seededByName = new Map(seeded.map((l) => [normalize(l.name), l.id]));
const REQUIRED = ['district', 'category', 'coordinates', 'coverPhotoUrl'];

let session;
try {
  session = await openAdminSession();
  const snapshot = await getDocs(collection(session.db, 'locations'));
  const incomplete = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((l) => REQUIRED.some((field) => !l[field]));

  console.log(`Toplam ${snapshot.size} mekan, ${incomplete.length} tanesinde eksik alan var.\n`);
  for (const l of incomplete) {
    const missing = REQUIRED.filter((field) => !l[field]).join(', ');
    const copyOf = seededByName.get(normalize(l.name));
    console.log(`- ${l.id} | "${l.name}" | eksik: ${missing}` + (copyOf ? ` | KOPYA (asıl kayıt: ${copyOf})` : ''));
  }

  if (deleteIds.size) {
    // Güvenlik: yalnızca eksik alanlı olarak listelenen kayıtlar silinebilir.
    const deletable = incomplete.filter((l) => deleteIds.has(l.id));
    const refused = [...deleteIds].filter((id) => !deletable.some((l) => l.id === id));
    for (const l of deletable) {
      await deleteDoc(doc(session.db, 'locations', l.id));
      console.log(`🗑  silindi: ${l.id} "${l.name}"`);
    }
    if (refused.length) console.log(`Silinmedi (listede yok veya eksiksiz kayıt): ${refused.join(', ')}`);
  }
} catch (error) {
  console.error('✖', error.message);
  process.exitCode = 1;
} finally {
  await session?.close();
}
