'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { useAdminAuth } from '@/lib/admin-auth';
import { auth } from '@/lib/firebase';

import styles from './login.module.css';

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/invalid-email': 'Geçerli bir e-posta adresi gir.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
  'auth/network-request-failed': 'İnternet bağlantını kontrol et.',
};

export default function LoginPage() {
  const router = useRouter();
  const state = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.status === 'admin' || state.status === 'notAdmin') router.replace('/');
  }, [state.status, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(ERRORS[code] ?? 'Giriş yapılamadı.');
      setBusy(false);
    }
  }

  return (
    <main className={styles.wrap}>
      <form className={`card ${styles.form}`} onSubmit={onSubmit}>
        <div>
          <h1>Gezgin Rotalar Yönetim</h1>
          <p className="muted">Mobil uygulamadaki admin hesabınla giriş yap.</p>
        </div>
        <label className="field" htmlFor="email">
          E-posta
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field" htmlFor="password">
          Şifre
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="notice error" role="alert">{error}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </main>
  );
}
