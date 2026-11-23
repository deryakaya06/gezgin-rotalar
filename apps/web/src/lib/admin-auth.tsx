'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@repo/shared';

import { auth, db } from '@/lib/firebase';

/**
 * loading: oturum henüz belli değil · signedOut: giriş yok ·
 * notAdmin: giriş var ama users/{uid}.role "admin" değil · admin: panel açık.
 * Asıl koruma firestore.rules'ta; bu yalnızca arayüzü yönlendirir.
 */
type AdminState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'notAdmin'; user: User }
  | { status: 'admin'; user: User; displayName: string };

const AdminAuthContext = createContext<AdminState>({ status: 'loading' });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>({ status: 'loading' });

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState({ status: 'signedOut' });
        return;
      }
      getDoc(doc(db, COLLECTIONS.users, user.uid))
        .then((snap) => {
          const data = snap.data();
          setState(
            data?.role === 'admin'
              ? { status: 'admin', user, displayName: data.displayName ?? user.email ?? 'Admin' }
              : { status: 'notAdmin', user }
          );
        })
        .catch(() => setState({ status: 'notAdmin', user }));
    });
  }, []);

  return <AdminAuthContext.Provider value={state}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function logout() {
  return signOut(auth);
}
