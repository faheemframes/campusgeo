import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#020617',
};

export const metadata: Metadata = {
  title: 'Campus Geo — SRM KTR',
  description: 'How well do you know SRM? Explore 360° panoramas, guess your campus location, and share your score!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className={`${inter.className} min-h-full h-full bg-slate-950 text-slate-100 flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
