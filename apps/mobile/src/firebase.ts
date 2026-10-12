import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDdjXGaCogNZqOsL8UEj9xg_JmbAs6FqHc",
  authDomain: "gezgin-rotalar.firebaseapp.com",
  projectId: "gezgin-rotalar",
  storageBucket: "gezgin-rotalar.firebasestorage.app",
  messagingSenderId: "635324784027",
  appId: "1:635324784027:web:6fe2a246c26a330338d53e",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);