import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

import { AdminAuthProvider } from '@/lib/admin-auth';

import './globals.css';

const sans = IBM_Plex_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Gezgin Rotalar Yönetim',
  description: 'Mekanları ve sponsorlu içerikleri yönetme paneli',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </body>
    </html>
  );
}
