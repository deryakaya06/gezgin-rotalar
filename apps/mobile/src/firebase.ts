import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDdjXGaCogNZqOsL8UEj9xg_JmbAs6FqHc",
  authDomain: "gezgin-rotalar.firebaseapp.com",
  projectId: "gezgin-rotalar",
  storageBucket: "gezgin-rotalar.firebasestorage.app",
  messagingSenderId: "635324784027",
  appId: "1:635324784027:web:6fe2a246c26a330338d53e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);