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

  test('check-in silinemez', async () => {
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
