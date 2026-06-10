import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autoreply Web App',
  description: 'Web untuk membalas chat otomatis dengan cepat di latar belakang. Support Vercel deployment.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#202c33',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body suppressHydrationWarning className="bg-[#111b21]">{children}</body>
    </html>
  );
}
