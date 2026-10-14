import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, type UserProfile } from '@repo/shared';

import { auth, db } from '@/firebase';
import { migrateLegacyProfile, syncSearchName } from '@/services/users';

type AuthState = {
  user: User | null;
  /** Firestore'daki users/{uid} dokümanı; kayıt sırasında kısa bir süre null olabilir. */
  profile: UserProfile | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  initializing: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Profil, ait olduğu kullanıcının uid'siyle birlikte tutulur; çıkış yapıldığında
  // veya kullanıcı değiştiğinde eski profil effect içinde sıfırlanmadan geçersiz sayılır.
  const [profileState, setProfileState] = useState<{ uid: string; data: UserProfile | null }>();
  const profile = user && profileState?.uid === user.uid ? profileState.data : null;
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    let migrating = false;
    return onSnapshot(
      doc(db, COLLECTIONS.users, user.uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          setProfileState({ uid: user.uid, data: null });
          return;
        }
        const data = snapshot.data();
        if (data.totalPoints === undefined) {
          if (!migrating) {
            migrating = true;
            migrateLegacyProfile(user.uid, user.email, data).catch((error) => {
              console.log('Profil taşınamadı:', error.message);
            });
          }
          return;
        }
        setProfileState({ uid: user.uid, data: data as UserProfile });
        // Arama alanı olmayan (eski) hesaplar ilk girişte aramaya eklenir.
        syncSearchName(user.uid, data as UserProfile)?.catch((error) => {
          console.log('Arama alanı güncellenemedi:', error.message);
        });
      },
      (error) => {
        console.log('Profil dinlenemedi:', error.message);
      }
    );
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
