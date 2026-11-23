// firestore.rules için emülator testleri. Çalıştırma: npm test
// İstemci yazımları apps/mobile/src/services/* içindeki batch'lerle aynı şekilde yapılır.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, test } from 'node:test';

import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  getDocs,
  orderBy,
  query,
  where,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-gezgin';
const POINTS = 10;
const [fsHost, fsPort] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
const [authHost, authPort] = process.env.FIREBASE_AUTH_EMULATOR_HOST.split(':');
const apps = [];

async function signUp(name) {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'fake' }, `${name}-${apps.length}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, fsHost, Number(fsPort));
  const cred = await createUserWithEmailAndPassword(auth, `${name}-${Date.now()}@test.com`, 'secret123');
  return { uid: cred.user.uid, db };
}

// "Bearer owner" ile emülatörün REST API'si kuralları atlar (veri hazırlamak için).
async function adminSet(path, fields) {
  const res = await fetch(
    `http://${fsHost}:${fsPort}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: Object.fromEntries(
          Object.entries(fields).map(([k, v]) => [
            k,
            typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) },
          ])
        ),
      }),
    }
  );
  assert.ok(res.ok, `adminSet ${path}: ${res.status}`);
}

const newProfile = (displayName) => ({
  displayName,
  accountType: 'couple',
  totalPoints: 0,
  visitCount: 0,
  createdAt: serverTimestamp(),
});

/** apps/mobile/src/services/checkins.ts ile aynı batch; overrides ile hile denenir. */
function checkInBatch(user, { points = POINTS, writeVisit = points > 0, writeUser = true, ...overrides } = {}) {
  const ref = doc(collection(user.db, 'check_ins'));
  const batch = writeBatch(user.db);
  batch.set(ref, {
    userId: user.uid,
    locationId: 'galata',
    locationName: 'Galata Kulesi',
    note: '',
    points,
    createdAt: serverTimestamp(),
    ...overrides,
  });
  if (writeUser) {
    batch.update(doc(user.db, 'users', user.uid), {
      totalPoints: increment(points),
      visitCount: increment(1),
      lastCheckInId: ref.id,
    });
  }
  if (writeVisit) {
    batch.set(doc(user.db, 'users', user.uid, 'visits', 'galata'), {
      lastAwardedAt: serverTimestamp(),
      checkInId: ref.id,
    });
  }
  return batch.commit();
}

function followBatch(me, targetUid, { following = true, mirror = true, remove = false } = {}) {
  const batch = writeBatch(me.db);
  const followingRef = doc(me.db, 'users', me.uid, 'following', targetUid);
  const mirrorRef = doc(me.db, 'users', targetUid, 'followers', me.uid);
  if (following) remove ? batch.delete(followingRef) : batch.set(followingRef, { createdAt: serverTimestamp() });
  if (mirror) remove ? batch.delete(mirrorRef) : batch.set(mirrorRef, { createdAt: serverTimestamp() });
  return batch.commit();
}

async function profileOf(user, uid = user.uid) {
  return (await getDoc(doc(user.db, 'users', uid))).data();
}

async function newUser(name) {
  const user = await signUp(name);
  await setDoc(doc(user.db, 'users', user.uid), newProfile(name));
  return user;
}

before(async () => {
  await adminSet('locations/galata', { name: 'Galata Kulesi', description: 'test' });
});

after(async () => {
  for (const app of apps) {
    await terminate(getFirestore(app));
    await deleteApp(app);
  }
});

describe('users', () => {
  test('sıfırdan farklı puanla profil oluşturulamaz', async () => {
    const eve = await signUp('eve');
    await assert.rejects(setDoc(doc(eve.db, 'users', eve.uid), { ...newProfile('Eve'), totalPoints: 999 }));
  });

  test('başkasının profili oluşturulamaz', async () => {
    const eve = await signUp('eve');
    await assert.rejects(setDoc(doc(eve.db, 'users', 'baska-biri'), newProfile('X')));
  });

  test('puan doğrudan değiştirilemez', async () => {
    const alice = await newUser('alice');
    await assert.rejects(updateDoc(doc(alice.db, 'users', alice.uid), { totalPoints: 500 }));
  });

  test('görünen ad değiştirilebilir', async () => {
    const alice = await newUser('alice');
    await updateDoc(doc(alice.db, 'users', alice.uid), { displayName: 'Alice & Can' });
  });
});

describe('check_ins', () => {
  test('geçerli check-in puan ve ziyaret sayısını artırır', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    const p = await profileOf(bob);
    assert.equal(p.totalPoints, POINTS);
    assert.equal(p.visitCount, 1);
  });

  test('24 saat içinde aynı mekandan ikinci kez puan alınamaz, puansız check-in olur', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    await assert.rejects(checkInBatch(bob), 'ikinci puanli check-in reddedilmeli');
    await checkInBatch(bob, { points: 0 });
    const p = await profileOf(bob);
    assert.equal(p.totalPoints, POINTS);
    assert.equal(p.visitCount, 2);
  });

  test('puan miktarı değiştirilemez', async () => {
    const bob = await newUser('bob');
    await assert.rejects(checkInBatch(bob, { points: 1000 }));
  });

  test('visits kaydı olmadan puanlı check-in yapılamaz', async () => {
    const bob = await newUser('bob');
    await assert.rejects(checkInBatch(bob, { writeVisit: false }));
  });

  test('sayaç güncellenmeden check-in yapılamaz', async () => {
    const bob = await newUser('bob');
    await assert.rejects(checkInBatch(bob, { writeUser: false }));
  });

  test('mevcut bir check-in ile tekrar puan toplanamaz', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await assert.rejects(
      updateDoc(doc(bob.db, 'users', bob.uid), {
        totalPoints: increment(POINTS),
        visitCount: increment(1),
        lastCheckInId,
      })
    );
  });

  test('yanlış mekan adı, olmayan mekan veya başkası adına check-in reddedilir', async () => {
    const bob = await newUser('bob');
    await assert.rejects(checkInBatch(bob, { locationName: 'Sahte Ad' }));
    await assert.rejects(checkInBatch(bob, { locationId: 'olmayan', writeVisit: false, points: 0 }));
    await assert.rejects(checkInBatch(bob, { userId: 'baska-biri', points: 0 }));
  });

  test('check-in tek başına silinemez; puan geri alınmalı', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    const batch = writeBatch(bob.db);
    batch.delete(doc(bob.db, 'check_ins', lastCheckInId));
    await assert.rejects(batch.commit());
  });
});

describe('takip', () => {
  test('takip et / bırak iki tarafı birlikte günceller ve count() doğru sayar', async () => {
    const alice = await newUser('alice');
    const bob = await newUser('bob');

    await followBatch(alice, bob.uid);
    const followers = await getCountFromServer(collection(alice.db, 'users', bob.uid, 'followers'));
    const following = await getCountFromServer(collection(alice.db, 'users', alice.uid, 'following'));
    assert.equal(followers.data().count, 1);
    assert.equal(following.data().count, 1);

    await followBatch(alice, bob.uid, { remove: true });
    const after = await getCountFromServer(collection(alice.db, 'users', bob.uid, 'followers'));
    assert.equal(after.data().count, 0);
  });

  test('tek taraflı takip kaydı yazılamaz', async () => {
    const alice = await newUser('alice');
    const bob = await newUser('bob');
    await assert.rejects(followBatch(alice, bob.uid, { mirror: false }));
    await assert.rejects(followBatch(alice, bob.uid, { following: false }));
  });

  test('takip bırakılırken tek taraf silinemez', async () => {
    const alice = await newUser('alice');
    const bob = await newUser('bob');
    await followBatch(alice, bob.uid);
    await assert.rejects(followBatch(alice, bob.uid, { remove: true, mirror: false }));
  });

  test('başkası adına takipçi eklenemez, kendini takip edemezsin', async () => {
    const alice = await newUser('alice');
    const bob = await newUser('bob');
    const carol = await newUser('carol');
    await assert.rejects(
      setDoc(doc(alice.db, 'users', carol.uid, 'followers', bob.uid), { createdAt: serverTimestamp() })
    );
    await assert.rejects(followBatch(alice, alice.uid));
  });
});

describe('eski profil taşıma', () => {
  async function legacyUser() {
    const user = await signUp('legacy');
    await adminSet(`users/${user.uid}`, {
      email: 'legacy@test.com',
      accountType: 'friends',
      points: 30,
      createdAt: '2026-09-20T10:00:00.000Z',
    });
    return user;
  }

  // apps/mobile/src/services/users.ts migrateLegacyProfile ile aynı.
  function migrate(user, { totalPoints = 30, visitCount = 3, followTarget } = {}) {
    const batch = writeBatch(user.db);
    batch.update(doc(user.db, 'users', user.uid), {
      displayName: 'legacy',
      accountType: 'friends',
      totalPoints,
      visitCount,
      points: deleteField(),
      email: deleteField(),
    });
    if (followTarget) {
      batch.set(doc(user.db, 'users', followTarget, 'followers', user.uid), { createdAt: serverTimestamp() });
    }
    return batch.commit();
  }

  test('eski puanla birebir taşınır, eski takipler tamamlanır, yalnızca bir kez', async () => {
    const bob = await newUser('bob');
    const user = await legacyUser();
    await adminSet(`users/${user.uid}/following/${bob.uid}`, { createdAt: 'eski' });

    await migrate(user, { followTarget: bob.uid });
    const p = await profileOf(user);
    assert.equal(p.totalPoints, 30);
    assert.equal(p.visitCount, 3);
    assert.equal(p.email, undefined);
    assert.equal(p.points, undefined);
    const followers = await getCountFromServer(collection(user.db, 'users', bob.uid, 'followers'));
    assert.equal(followers.data().count, 1);

    await assert.rejects(migrate(user, { totalPoints: 999, visitCount: 99 }), 'ikinci tasima reddedilmeli');
  });

  test('taşıma sırasında puan şişirilemez', async () => {
    const user = await legacyUser();
    await assert.rejects(migrate(user, { totalPoints: 999 }));
    await assert.rejects(migrate(user, { visitCount: 50 }));
  });
});

describe('locations (admin)', () => {
  const validLocation = () => ({
    name: 'Moda Sahili',
    description: 'Gün batımı için.',
    district: 'Kadıköy',
    category: 'Park',
    coordinates: { latitude: 40.981, longitude: 29.026 },
    rating: 4.7,
    isFree: true,
    isSponsored: false,
    sponsorInfo: null,
  });

  async function adminUser() {
    const admin = await newUser('admin');
    await adminSet(`users/${admin.uid}`, {
      displayName: 'admin',
      accountType: 'friends',
      totalPoints: 0,
      visitCount: 0,
      role: 'admin',
    });
    return admin;
  }

  test('admin mekan ekleyebilir ve güncelleyebilir', async () => {
    const admin = await adminUser();
    await setDoc(doc(admin.db, 'locations', 'moda'), validLocation());
    await updateDoc(doc(admin.db, 'locations', 'moda'), {
      isSponsored: true,
      sponsorInfo: { name: 'Moda Kahvecisi', offer: 'Check-in yapana %10 indirim' },
    });
  });

  test('admin kapak fotoğrafı ekleyebilir, başka siteden adres reddedilir', async () => {
    const admin = await adminUser();
    const rulesText = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    const cloudName = rulesText.match(/function cloudinaryCloudName\(\) \{\s*return '([^']+)'/)[1];
    await setDoc(doc(admin.db, 'locations', 'kapakli'), {
      ...validLocation(),
      coverPhotoUrl: `https://res.cloudinary.com/${cloudName}/image/upload/v1/kapak.jpg`,
      coverPhotoCredit: 'A.Savin · FAL',
      coverPhotoSource: 'https://commons.wikimedia.org/wiki/File:Ornek.jpg',
    });
    await assert.rejects(
      setDoc(doc(admin.db, 'locations', 'kapaksiz'), {
        ...validLocation(),
        coverPhotoUrl: 'https://kotu-site.com/kapak.jpg',
      })
    );
  });

  test('normal kullanıcı mekan ekleyemez', async () => {
    const bob = await newUser('bob');
    await assert.rejects(setDoc(doc(bob.db, 'locations', 'sahte'), validLocation()));
  });

  test('geçersiz mekan verisi reddedilir', async () => {
    const admin = await adminUser();
    await assert.rejects(setDoc(doc(admin.db, 'locations', 'x1'), { ...validLocation(), rating: 9 }));
    await assert.rejects(
      setDoc(doc(admin.db, 'locations', 'x2'), {
        ...validLocation(),
        coordinates: { latitude: 200, longitude: 29 },
      })
    );
    await assert.rejects(setDoc(doc(admin.db, 'locations', 'x3'), { ...validLocation(), hack: true }));
  });

  test('kullanıcı kendine admin rolü veremez', async () => {
    const eve = await signUp('eve');
    await assert.rejects(setDoc(doc(eve.db, 'users', eve.uid), { ...newProfile('Eve'), role: 'admin' }));
    const bob = await newUser('bob');
    await assert.rejects(updateDoc(doc(bob.db, 'users', bob.uid), { role: 'admin' }));
  });
});

describe('check-in fotoğrafı', () => {
  // Kurallardaki cloudinaryCloudName() değerini okur; adı değişince test de uyum sağlar.
  const rulesText = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const cloudName = rulesText.match(/function cloudinaryCloudName\(\) \{\s*return '([^']+)'/)[1];
  const valid = `https://res.cloudinary.com/${cloudName}/image/upload/v1/check-ins/abc.jpg`;

  test('kendi Cloudinary hesabımızdaki fotoğraf kabul edilir', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob, { photoUrl: valid });
  });

  test('başka site veya başka Cloudinary hesabı reddedilir', async () => {
    const bob = await newUser('bob');
    await assert.rejects(checkInBatch(bob, { photoUrl: 'https://kotu-site.com/foto.jpg', points: 0, writeVisit: false }));
    await assert.rejects(
      checkInBatch(bob, {
        photoUrl: 'https://res.cloudinary.com/baska-hesap/image/upload/x.jpg',
        points: 0,
        writeVisit: false,
      })
    );
  });
});

describe('beğeniler', () => {
  /** apps/mobile/src/services/likes.ts ile aynı batch; overrides ile hile denenir. */
  function likeBatch(user, checkInId, { remove = false, delta = remove ? -1 : 1, writeLike = true, writeCount = true, as } = {}) {
    const batch = writeBatch(user.db);
    const likeRef = doc(user.db, 'check_ins', checkInId, 'likes', as ?? user.uid);
    if (writeLike) remove ? batch.delete(likeRef) : batch.set(likeRef, { createdAt: serverTimestamp() });
    if (writeCount) batch.update(doc(user.db, 'check_ins', checkInId), { likeCount: increment(delta) });
    return batch.commit();
  }

  async function checkInOf(user) {
    await checkInBatch(user);
    return (await profileOf(user)).lastCheckInId;
  }

  test('beğen ve geri al sayacı birlikte günceller', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await checkInOf(bob);

    await likeBatch(alice, id);
    assert.equal((await getDoc(doc(alice.db, 'check_ins', id))).data().likeCount, 1);
    await likeBatch(bob, id);
    assert.equal((await getDoc(doc(alice.db, 'check_ins', id))).data().likeCount, 2);

    await likeBatch(alice, id, { remove: true });
    assert.equal((await getDoc(doc(alice.db, 'check_ins', id))).data().likeCount, 1);
  });

  test('aynı check-in iki kez beğenilemez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await checkInOf(bob);
    await likeBatch(alice, id);
    await assert.rejects(likeBatch(alice, id));
  });

  test('sayaç beğenisiz değiştirilemez, birden fazla artırılamaz', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await checkInOf(bob);
    await assert.rejects(likeBatch(alice, id, { writeLike: false }));
    await assert.rejects(likeBatch(alice, id, { delta: 100 }));
    await assert.rejects(likeBatch(alice, id, { writeCount: false }));
  });

  test('başkası adına beğeni eklenemez, check-in başka alanı değiştirilemez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await checkInOf(bob);
    await assert.rejects(likeBatch(alice, id, { as: bob.uid }));
    await assert.rejects(updateDoc(doc(alice.db, 'check_ins', id), { points: 999 }));
  });
});

describe('kullanıcı arama alanı (searchName)', () => {
  test('profil arama alanıyla oluşturulur ve sahibi güncelleyebilir', async () => {
    const eve = await signUp('eve');
    await setDoc(doc(eve.db, 'users', eve.uid), { ...newProfile('Ayşe'), searchName: 'ayse' });
    await updateDoc(doc(eve.db, 'users', eve.uid), { displayName: 'Ayşe & Can', searchName: 'ayse & can' });
  });

  test('çok uzun arama alanı reddedilir', async () => {
    const eve = await signUp('eve');
    await assert.rejects(
      setDoc(doc(eve.db, 'users', eve.uid), { ...newProfile('Eve'), searchName: 'x'.repeat(61) })
    );
  });

  test('admin başkasının arama alanını doldurabilir, normal kullanıcı dolduramaz', async () => {
    const target = await newUser('hedef');
    const bob = await newUser('bob');
    await assert.rejects(updateDoc(doc(bob.db, 'users', target.uid), { searchName: 'hedef' }));

    const admin = await newUser('admin');
    await adminSet(`users/${admin.uid}`, {
      displayName: 'admin', accountType: 'friends', totalPoints: 0, visitCount: 0, role: 'admin',
    });
    await updateDoc(doc(admin.db, 'users', target.uid), { searchName: 'hedef' });
    // Admin bu yolla başka alanı değiştiremez.
    await assert.rejects(updateDoc(doc(admin.db, 'users', target.uid), { totalPoints: 999 }));
  });
});

describe('kullanıcı arama sorgusu', () => {
  test('"ay" ile başlayan arama alanları bulunur', async () => {
    const a = await signUp('arama');
    await setDoc(doc(a.db, 'users', a.uid), { ...newProfile('Aydın & Ece'), searchName: 'aydin & ece' });
    const b = await signUp('arama2');
    await setDoc(doc(b.db, 'users', b.uid), { ...newProfile('Zeynep'), searchName: 'zeynep' });

    const snap = await getDocs(
      query(collection(a.db, 'users'), where('searchName', '>=', 'ay'), where('searchName', '<=', 'ay\uf8ff'), orderBy('searchName'))
    );
    const names = snap.docs.map((d) => d.get('searchName'));
    assert.ok(names.includes('aydin & ece'));
    assert.ok(!names.includes('zeynep'));
  });
});

describe('profil fotoğrafı', () => {
  const rulesText = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const cloudName = rulesText.match(/function cloudinaryCloudName\(\) \{\s*return '([^']+)'/)[1];
  const photo = `https://res.cloudinary.com/${cloudName}/image/upload/v1/avatar.jpg`;

  test('sahibi kendi Cloudinary fotoğrafını ekleyip kaldırabilir', async () => {
    const bob = await newUser('bob');
    await updateDoc(doc(bob.db, 'users', bob.uid), { photoUrl: photo });
    await updateDoc(doc(bob.db, 'users', bob.uid), { photoUrl: deleteField() });
  });

  test('başka siteden fotoğraf ve başkasının fotoğrafını değiştirmek reddedilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await assert.rejects(updateDoc(doc(bob.db, 'users', bob.uid), { photoUrl: 'https://kotu-site.com/a.jpg' }));
    await assert.rejects(updateDoc(doc(alice.db, 'users', bob.uid), { photoUrl: photo }));
  });
});

describe('check-in silme', () => {
  /** apps/mobile/src/services/checkins.ts deleteCheckIn ile aynı batch. */
  function deleteBatch(user, checkInId, points, { pointsDelta = -points, visitDelta = -1 } = {}) {
    const batch = writeBatch(user.db);
    batch.delete(doc(user.db, 'check_ins', checkInId));
    batch.update(doc(user.db, 'users', user.uid), {
      totalPoints: increment(pointsDelta),
      visitCount: increment(visitDelta),
      lastDeletedCheckInId: checkInId,
    });
    return batch.commit();
  }

  test('kendi check-in silinince puan ve ziyaret geri alınır', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await deleteBatch(bob, lastCheckInId, POINTS);
    const p = await profileOf(bob);
    assert.equal(p.totalPoints, 0);
    assert.equal(p.visitCount, 0);
  });

  test('puan yanlış miktarda düşürülemez', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await assert.rejects(deleteBatch(bob, lastCheckInId, POINTS, { pointsDelta: 0 }));
    await assert.rejects(deleteBatch(bob, lastCheckInId, POINTS, { visitDelta: 0 }));
  });

  test('başkasının check-in silinemez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await assert.rejects(deleteBatch(alice, lastCheckInId, POINTS));
  });

  test('silip 24 saat içinde tekrar yapmak puan getirmez', async () => {
    const bob = await newUser('bob');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await deleteBatch(bob, lastCheckInId, POINTS);
    await assert.rejects(checkInBatch(bob), 'puanli tekrar reddedilmeli');
    await checkInBatch(bob, { points: 0 });
    assert.equal((await profileOf(bob)).totalPoints, 0);
  });
});

describe('gezi planları', () => {
  const trip = (uid, overrides = {}) => ({
    userId: uid,
    title: 'Boğaz turu',
    date: '2026-12-05',
    locationIds: ['galata'],
    locationNames: ['Galata Kulesi'],
    note: '',
    createdAt: serverTimestamp(),
    ...overrides,
  });

  test('sahibi plan oluşturur, okur ve siler; başkası okuyamaz', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const ref = doc(collection(bob.db, 'planned_trips'));
    await setDoc(ref, trip(bob.uid));
    assert.equal((await getDoc(ref)).data().title, 'Boğaz turu');
    await assert.rejects(getDoc(doc(alice.db, 'planned_trips', ref.id)));
    await assert.rejects(writeBatch(alice.db).delete(doc(alice.db, 'planned_trips', ref.id)).commit());
    await writeBatch(bob.db).delete(ref).commit();
  });

  test('başkası adına veya geçersiz plan reddedilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const ref = () => doc(collection(bob.db, 'planned_trips'));
    await assert.rejects(setDoc(ref(), trip(alice.uid)));
    await assert.rejects(setDoc(ref(), trip(bob.uid, { title: 'x' })));
    await assert.rejects(setDoc(ref(), trip(bob.uid, { date: '5 Aralık' })));
    await assert.rejects(setDoc(ref(), trip(bob.uid, { locationIds: [], locationNames: [] })));
    await assert.rejects(setDoc(ref(), trip(bob.uid, { locationNames: [] })));
    await assert.rejects(setDoc(ref(), trip(bob.uid, { role: 'admin' })));
  });
});

describe('şikâyet ve moderasyon', () => {
  const report = (reporter, checkInId, overrides = {}) => ({
    reporterId: reporter.uid,
    checkInId,
    reason: 'spam',
    createdAt: serverTimestamp(),
    ...overrides,
  });
  const reportRef = (user, checkInId) => doc(user.db, 'reports', `${checkInId}_${user.uid}`);

  async function newAdmin() {
    const admin = await newUser('admin');
    await adminSet(`users/${admin.uid}`, {
      displayName: 'admin', accountType: 'friends', totalPoints: 0, visitCount: 0, role: 'admin',
    });
    return admin;
  }

  /** apps/web/src/lib/moderation.ts removeCheckIn ile aynı batch. */
  function removeBatch(actor, ownerUid, checkInId, points, reportIds = []) {
    const batch = writeBatch(actor.db);
    batch.delete(doc(actor.db, 'check_ins', checkInId));
    batch.update(doc(actor.db, 'users', ownerUid), {
      totalPoints: increment(-points),
      visitCount: increment(-1),
      lastDeletedCheckInId: checkInId,
    });
    for (const id of reportIds) batch.delete(doc(actor.db, 'reports', id));
    return batch.commit();
  }

  test('kullanıcı başkasının paylaşımını bir kez şikâyet edebilir, kendininkini edemez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await setDoc(reportRef(alice, lastCheckInId), report(alice, lastCheckInId));
    await assert.rejects(setDoc(reportRef(alice, lastCheckInId), report(alice, lastCheckInId)), 'ikinci şikâyet');
    await assert.rejects(setDoc(reportRef(bob, lastCheckInId), report(bob, lastCheckInId)), 'kendi paylaşımı');
  });

  test('geçersiz şikâyet reddedilir, şikâyetleri normal kullanıcı okuyamaz', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await assert.rejects(setDoc(reportRef(alice, lastCheckInId), report(alice, lastCheckInId, { reason: 'yok' })));
    await assert.rejects(setDoc(reportRef(alice, 'olmayan'), report(alice, 'olmayan')));
    await assert.rejects(setDoc(doc(alice.db, 'reports', 'rastgele'), report(alice, lastCheckInId)));
    await setDoc(reportRef(alice, lastCheckInId), report(alice, lastCheckInId));
    await assert.rejects(getDoc(reportRef(alice, lastCheckInId)));
    await assert.rejects(getDocs(collection(alice.db, 'reports')));
  });

  test('admin paylaşımı kaldırınca sahibinin puanı geri alınır ve şikâyet kapanır', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const admin = await newAdmin();
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await setDoc(reportRef(alice, lastCheckInId), report(alice, lastCheckInId));
    assert.ok((await getDocs(collection(admin.db, 'reports'))).size >= 1);

    await removeBatch(admin, bob.uid, lastCheckInId, POINTS, [`${lastCheckInId}_${alice.uid}`]);
    const after = await profileOf(bob);
    assert.equal(after.totalPoints, 0);
    assert.equal(after.visitCount, 0);
    assert.equal((await getDoc(doc(admin.db, 'reports', `${lastCheckInId}_${alice.uid}`))).exists(), false);
  });

  test('admin puanı yanlış düşüremez, normal kullanıcı başkasının paylaşımını kaldıramaz', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const admin = await newAdmin();
    await checkInBatch(bob);
    const { lastCheckInId } = await profileOf(bob);
    await assert.rejects(removeBatch(admin, bob.uid, lastCheckInId, POINTS + 5));
    await assert.rejects(removeBatch(alice, bob.uid, lastCheckInId, POINTS));
  });
});

describe('mekan önerileri ve oylama', () => {
  const suggestion = (user, name, overrides = {}) => ({
    userId: user.uid,
    userName: name,
    name: 'Kuzguncuk Bostanı',
    district: 'Üsküdar',
    category: 'Park',
    description: 'Mahalle bostanı',
    status: 'pending',
    voteCount: 0,
    createdAt: serverTimestamp(),
    ...overrides,
  });

  async function suggest(user, name) {
    const ref = doc(collection(user.db, 'suggested_locations'));
    await setDoc(ref, suggestion(user, name));
    return ref.id;
  }

  /** apps/mobile/src/services/suggestions.ts ile aynı batch; overrides ile hile denenir. */
  function voteBatch(user, id, { remove = false, delta = remove ? -1 : 1, writeVote = true, writeCount = true } = {}) {
    const batch = writeBatch(user.db);
    const voteRef = doc(user.db, 'suggested_locations', id, 'votes', user.uid);
    if (writeVote) remove ? batch.delete(voteRef) : batch.set(voteRef, { createdAt: serverTimestamp() });
    if (writeCount) batch.update(doc(user.db, 'suggested_locations', id), { voteCount: increment(delta) });
    return batch.commit();
  }

  const votes = async (user, id) =>
    (await getDoc(doc(user.db, 'suggested_locations', id))).data().voteCount;

  test('kullanıcı öneri oluşturur, başkaları okuyabilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await suggest(bob, 'bob');
    assert.equal((await getDoc(doc(alice.db, 'suggested_locations', id))).data().name, 'Kuzguncuk Bostanı');
  });

  test('geçersiz veya hileli öneri reddedilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const ref = () => doc(collection(bob.db, 'suggested_locations'));
    await assert.rejects(setDoc(ref(), suggestion(alice, 'alice')), 'başkası adına');
    await assert.rejects(setDoc(ref(), suggestion(bob, 'sahte ad')), 'yanlış ad');
    await assert.rejects(setDoc(ref(), suggestion(bob, 'bob', { voteCount: 50 })), 'hazır oy');
    await assert.rejects(setDoc(ref(), suggestion(bob, 'bob', { status: 'approved' })), 'kendi onayı');
    await assert.rejects(setDoc(ref(), suggestion(bob, 'bob', { category: 'Yok' })), 'kategori');
    await assert.rejects(setDoc(ref(), suggestion(bob, 'bob', { name: 'x' })), 'kısa ad');
  });

  test('oy ver ve geri al sayacı birlikte günceller', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await suggest(bob, 'bob');
    await voteBatch(alice, id);
    assert.equal(await votes(alice, id), 1);
    await voteBatch(alice, id, { remove: true });
    assert.equal(await votes(alice, id), 0);
  });

  test('iki kez, kendi önerisine veya sayaç şişirerek oy verilemez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await suggest(bob, 'bob');
    await assert.rejects(voteBatch(bob, id), 'kendi önerisi');
    await assert.rejects(voteBatch(alice, id, { delta: 5 }), 'fazla artış');
    await assert.rejects(voteBatch(alice, id, { writeVote: false }), 'oysuz sayaç');
    await assert.rejects(voteBatch(alice, id, { writeCount: false }), 'sayaçsız oy');
    await voteBatch(alice, id);
    await assert.rejects(voteBatch(alice, id), 'ikinci oy');
  });

  test('yalnızca sahibi bekleyen önerisini silebilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = await suggest(bob, 'bob');
    await assert.rejects(writeBatch(alice.db).delete(doc(alice.db, 'suggested_locations', id)).commit());
    await writeBatch(bob.db).delete(doc(bob.db, 'suggested_locations', id)).commit();
  });
});

describe('kullanıcı engelleme', () => {
  /** apps/mobile/src/services/blocks.ts ile aynı batch: engeller ve iki yöndeki takibi kaldırır. */
  function blockBatch(me, targetUid) {
    const batch = writeBatch(me.db);
    batch.set(doc(me.db, 'users', me.uid, 'blocked', targetUid), { createdAt: serverTimestamp() });
    batch.delete(doc(me.db, 'users', me.uid, 'following', targetUid));
    batch.delete(doc(me.db, 'users', targetUid, 'followers', me.uid));
    batch.delete(doc(me.db, 'users', targetUid, 'following', me.uid));
    batch.delete(doc(me.db, 'users', me.uid, 'followers', targetUid));
    return batch.commit();
  }

  const unblock = (me, targetUid) =>
    writeBatch(me.db).delete(doc(me.db, 'users', me.uid, 'blocked', targetUid)).commit();

  const followerCount = async (user, uid) =>
    (await getCountFromServer(collection(user.db, 'users', uid, 'followers'))).data().count;

  test('engelleme iki yöndeki takibi kaldırır', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await followBatch(alice, bob.uid);
    await followBatch(bob, alice.uid);
    await blockBatch(bob, alice.uid);
    assert.equal(await followerCount(bob, bob.uid), 0);
    assert.equal(await followerCount(bob, alice.uid), 0);
  });

  test('engellenen kişi engelleyeni takip edemez, engel kalkınca edebilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await blockBatch(bob, alice.uid);
    await assert.rejects(followBatch(alice, bob.uid), 'engellenen');
    await assert.rejects(followBatch(bob, alice.uid), 'engelleyen');
    await unblock(bob, alice.uid);
    await followBatch(alice, bob.uid);
  });

  test('engel listesi özeldir; başkası adına ve kendini engelleme reddedilir', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await blockBatch(bob, alice.uid);
    assert.equal((await getDoc(doc(bob.db, 'users', bob.uid, 'blocked', alice.uid))).exists(), true);
    await assert.rejects(getDoc(doc(alice.db, 'users', bob.uid, 'blocked', alice.uid)));
    await assert.rejects(unblock({ ...alice, uid: bob.uid }, alice.uid), 'başkasının engelini kaldırma');
    await assert.rejects(setDoc(doc(alice.db, 'users', bob.uid, 'blocked', 'x'), { createdAt: serverTimestamp() }));
    await assert.rejects(setDoc(doc(bob.db, 'users', bob.uid, 'blocked', bob.uid), { createdAt: serverTimestamp() }));
  });

  test('üçüncü kişi başkasının takip kaydını silemez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const carol = await newUser('carol');
    await followBatch(alice, bob.uid);
    const batch = writeBatch(carol.db);
    batch.delete(doc(carol.db, 'users', alice.uid, 'following', bob.uid));
    batch.delete(doc(carol.db, 'users', bob.uid, 'followers', alice.uid));
    await assert.rejects(batch.commit());
  });
});

describe('bildirimler', () => {
  const notification = (actor, actorName, overrides = {}) => ({
    type: 'follow',
    actorId: actor.uid,
    actorName,
    targetId: '',
    targetName: '',
    read: false,
    createdAt: serverTimestamp(),
    ...overrides,
  });
  const inbox = (user, ownerUid, id) => doc(user.db, 'users', ownerUid, 'notifications', id);

  /** apps/mobile/src/services/follows.ts ile aynı batch. */
  function followWithNotice(me, name, targetUid) {
    const batch = writeBatch(me.db);
    batch.set(doc(me.db, 'users', me.uid, 'following', targetUid), { createdAt: serverTimestamp() });
    batch.set(doc(me.db, 'users', targetUid, 'followers', me.uid), { createdAt: serverTimestamp() });
    batch.set(inbox(me, targetUid, `follow_${me.uid}`), notification(me, name));
    return batch.commit();
  }

  function unfollowWithNotice(me, targetUid) {
    const batch = writeBatch(me.db);
    batch.delete(doc(me.db, 'users', me.uid, 'following', targetUid));
    batch.delete(doc(me.db, 'users', targetUid, 'followers', me.uid));
    batch.delete(inbox(me, targetUid, `follow_${me.uid}`));
    return batch.commit();
  }

  /** apps/mobile/src/services/checkins.ts ile aynı batch. */
  function taggedCheckIn(user, name, taggedIds, { notify = taggedIds, points = 0 } = {}) {
    const ref = doc(collection(user.db, 'check_ins'));
    const batch = writeBatch(user.db);
    batch.set(ref, {
      userId: user.uid, locationId: 'galata', locationName: 'Galata Kulesi', note: '', points,
      taggedUserIds: taggedIds, createdAt: serverTimestamp(),
    });
    batch.update(doc(user.db, 'users', user.uid), {
      totalPoints: increment(points), visitCount: increment(1), lastCheckInId: ref.id,
    });
    if (points > 0) {
      batch.set(doc(user.db, 'users', user.uid, 'visits', 'galata'), {
        lastAwardedAt: serverTimestamp(),
        checkInId: ref.id,
      });
    }
    for (const id of notify) {
      batch.set(inbox(user, id, `tag_${ref.id}`), notification(user, name, {
        type: 'tag', targetId: ref.id, targetName: 'Galata Kulesi',
      }));
    }
    return batch.commit();
  }

  async function newAdmin() {
    const admin = await newUser('admin');
    await adminSet(`users/${admin.uid}`, {
      displayName: 'admin', accountType: 'friends', totalPoints: 0, visitCount: 0, role: 'admin',
    });
    return admin;
  }

  test('takip bildirimi yazılır, yalnızca sahibi okur, takip bırakılınca kalkar, tekrar takip olur', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await followWithNotice(alice, 'alice', bob.uid);
    const id = `follow_${alice.uid}`;
    assert.equal((await getDoc(inbox(bob, bob.uid, id))).data().actorName, 'alice');
    await assert.rejects(getDoc(inbox(alice, bob.uid, id)));
    await unfollowWithNotice(alice, bob.uid);
    assert.equal((await getDoc(inbox(bob, bob.uid, id))).exists(), false);
    await followWithNotice(alice, 'alice', bob.uid);
  });

  test('sahte bildirim yazılamaz', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const id = `follow_${alice.uid}`;
    await assert.rejects(setDoc(inbox(alice, bob.uid, id), notification(alice, 'alice')), 'takip etmeden');
    await assert.rejects(followWithNotice(alice, 'sahte ad', bob.uid), 'yanlış ad');
    await assert.rejects(setDoc(inbox(alice, bob.uid, 'suggestion_x'), notification(alice, 'alice', {
      type: 'suggestion_approved', targetId: 'x', targetName: 'x',
    })), 'admin olmadan onay');
  });

  test('sahibi okundu yapar, başka alanı değiştiremez', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    await followWithNotice(alice, 'alice', bob.uid);
    const ref = inbox(bob, bob.uid, `follow_${alice.uid}`);
    await assert.rejects(updateDoc(ref, { actorName: 'değişti' }));
    await updateDoc(ref, { read: true });
  });

  test('takip edilen 5 kişi etiketlenir; takip edilmeyen veya 6. kişi reddedilir', async () => {
    const bob = await newUser('bob');
    const friends = [];
    for (let i = 0; i < 5; i++) {
      const friend = await newUser(`arkadas${i}`);
      await followBatch(bob, friend.uid);
      friends.push(friend.uid);
    }
    const stranger = await newUser('yabanci');
    // Puanlı check-in en çok kural okuması yapan durum; Firestore'un istek sınırına takılmamalı.
    await taggedCheckIn(bob, 'bob', friends, { points: POINTS });
    await assert.rejects(taggedCheckIn(bob, 'bob', [stranger.uid]), 'takip edilmeyen');
    await assert.rejects(taggedCheckIn(bob, 'bob', [...friends, stranger.uid], { notify: [] }), '6 kişi');
  });

  test('admin öneriyi onaylar ve sahibine bildirim gider; normal kullanıcı onaylayamaz', async () => {
    const bob = await newUser('bob');
    const alice = await newUser('alice');
    const admin = await newAdmin();
    const ref = doc(collection(bob.db, 'suggested_locations'));
    await setDoc(ref, {
      userId: bob.uid, userName: 'bob', name: 'Bostan', district: 'Üsküdar', category: 'Park',
      description: '', status: 'pending', voteCount: 0, createdAt: serverTimestamp(),
    });
    await assert.rejects(updateDoc(doc(alice.db, 'suggested_locations', ref.id), { status: 'approved' }));

    const batch = writeBatch(admin.db);
    batch.update(doc(admin.db, 'suggested_locations', ref.id), { status: 'approved' });
    batch.set(inbox(admin, bob.uid, `suggestion_${ref.id}`), notification(admin, 'admin', {
      type: 'suggestion_approved', targetId: ref.id, targetName: 'Bostan',
    }));
    await batch.commit();
    assert.equal((await getDoc(inbox(bob, bob.uid, `suggestion_${ref.id}`))).data().type, 'suggestion_approved');
  });

  test('duyuruyu yalnızca admin sponsorlu mekan için yazar, herkes okur', async () => {
    const bob = await newUser('bob');
    const admin = await newAdmin();
    await adminSet('locations/sponsorlu', { name: 'Sponsor Kafe', description: 'x' });
    const announcement = (overrides = {}) => ({
      title: 'Kampanya', body: 'Bu hafta indirim', locationId: 'sponsorlu', locationName: 'Sponsor Kafe',
      createdAt: serverTimestamp(), ...overrides,
    });
    await assert.rejects(setDoc(doc(collection(admin.db, 'announcements')), announcement()), 'sponsorlu değil');
    await updateDoc(doc(admin.db, 'locations', 'sponsorlu'), { isSponsored: true });
    const ref = doc(collection(admin.db, 'announcements'));
    await setDoc(ref, announcement());
    assert.equal((await getDoc(doc(bob.db, 'announcements', ref.id))).data().title, 'Kampanya');
    await assert.rejects(setDoc(doc(collection(bob.db, 'announcements')), announcement()), 'normal kullanıcı');
  });
});
