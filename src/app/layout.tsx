import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#080b11',
};

export const metadata: Metadata = {
  title: 'Campus Geo — SRM KTR',
  description: 'How well do you know SRM? Explore 360° campus spots, guess your location, and challenge your friends!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${plusJakarta.variable} ${jetbrainsMono.variable} bg-[#080b11]`}>
      <body className="font-sans min-h-full h-full bg-[#080b11] text-slate-100 flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}

