'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { logout, useAdminAuth } from '@/lib/admin-auth';

import styles from './admin-shell.module.css';

/** Yalnızca admin'e içerik gösterir; giriş yoksa /login'e yönlendirir. */
export function AdminShell({ children }: { children: ReactNode }) {
  const state = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'signedOut') router.replace('/login');
  }, [state.status, router]);

  if (state.status === 'loading' || state.status === 'signedOut') {
    return <p className={`page muted ${styles.center}`}>Yükleniyor…</p>;
  }

  if (state.status === 'notAdmin') {
    return (
      <div className={`page ${styles.center}`}>
        <h1>Bu panele erişimin yok</h1>
        <p className="muted">
          {state.user.email} hesabı admin değil. Yetki için Firebase Console&apos;da bu hesabın
          users dokümanına <span className="mono">role: &quot;admin&quot;</span> eklenmeli.
        </p>
        <button className="btn" onClick={() => logout()}>
          Başka hesapla giriş yap
        </button>
      </div>
    );
  }

  return (
    <>
      <header className={styles.bar}>
        <div className={styles.barInner}>
          <Link href="/" className={styles.brand}>
            Gezgin Rotalar <span className="muted">· Yönetim</span>
          </Link>
          <div className={styles.user}>
            <span className="muted">{state.displayName}</span>
            <button className="btn" onClick={() => logout()}>
              Çıkış
            </button>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
