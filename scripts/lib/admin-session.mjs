// Betiklerin ortak admin girişi: e-posta ve şifreyi terminalde sorar (şifre ekranda
// görünmez, geçmişe kaydedilmez). ADMIN_EMAIL / ADMIN_PASSWORD ortam değişkenleri
// verilirse onları kullanır.
import { createInterface } from 'node:readline';

import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, terminate } from 'firebase/firestore';

// apps/mobile/src/firebase.ts ile aynı (herkese açık istemci yapılandırması).
const firebaseConfig = {
  apiKey: 'AIzaSyDdjXGaCogNZqOsL8UEj9xg_JmbAs6FqHc',
  authDomain: 'gezgin-rotalar.firebaseapp.com',
  projectId: 'gezgin-rotalar',
};

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Sorudan sonra yazılan karakterleri ekrana basma.
      rl._writeToOutput = (text) => {
        if (text.includes(question)) process.stdout.write(text);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

/** Admin olarak giriş yapar; { db, close } döndürür. */
export async function openAdminSession() {
  const email = process.env.ADMIN_EMAIL || (await ask('Admin e-posta: '));
  const password = process.env.ADMIN_PASSWORD || (await ask('Şifre (görünmez): ', { hidden: true }));

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // firebase emulators:exec altında çalışırsa gerçek veritabanı yerine emülatöre bağlanır.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(db, host, Number(port));
    connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
      disableWarnings: true,
    });
    console.log('Emülatör kullanılıyor.');
  }

  await signInWithEmailAndPassword(auth, email, password);

  return {
    db,
    async close() {
      await signOut(auth).catch(() => {});
      await terminate(db);
      await deleteApp(app);
    },
  };
}
