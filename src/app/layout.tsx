import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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
  metadataBase: new URL('https://campusgeo.vercel.app'),
  title: {
    default: 'Campus Geo — The Viral SRM KTR GeoGuessr Game',
    template: '%s | Campus Geo — SRM GeoGuessr',
  },
  description:
    'Test your SRM Institute of Science and Technology knowledge! Play the viral SRM GeoGuessr game featuring 360° panoramas and photo challenges across Tech Park, TP Ganesan Auditorium, Java Green, UB, Potheri & more. Guess locations, earn points, and share your score card.',
  keywords: [
    'srm game',
    'srm geoguessr',
    'geoguessr srm',
    'srm ktr geoguessr',
    'campus geoguessr',
    'srmist game',
    'srm campus game',
    'srm ktr campus game',
    'campusgeo',
    'campus geo srm',
    'srm tech park game',
    'potheri geoguessr',
    'college geoguessr',
    'srm chennai games',
    'srm student games',
  ],
  authors: [{ name: 'Campus Geo Team', url: 'https://campusgeo.vercel.app' }],
  creator: 'Campus Geo',
  publisher: 'Campus Geo',
  applicationName: 'Campus Geo',
  alternates: {
    canonical: 'https://campusgeo.vercel.app',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://campusgeo.vercel.app',
    siteName: 'Campus Geo — SRM GeoGuessr',
    title: 'Campus Geo — The Viral SRM KTR GeoGuessr Game',
    description:
      'Can you identify SRM KTR from a 360° street view or campus photo? Play 5 quick rounds, pinpoint your location on satellite maps, and challenge your friends!',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Campus Geo — SRM KTR GeoGuessr Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Geo — SRM KTR GeoGuessr Game',
    description:
      'How well do you know SRM? Explore 360° campus spots, guess your location, and challenge your friends!',
    images: ['/og-image.jpg'],
    creator: '@faheemframes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'game',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['WebApplication', 'VideoGame'],
  name: 'Campus Geo — SRM KTR GeoGuessr',
  alternateName: ['SRM GeoGuessr', 'SRM Game', 'CampusGeo', 'SRMIST Game'],
  url: 'https://campusgeo.vercel.app',
  description:
    'The premier SRM KTR GeoGuessr game. Explore 360° panoramic views across SRM Institute of Science and Technology campus, drop pins on high-res satellite maps, and compete with SRMites.',
  applicationCategory: 'GameApplication',
  genre: ['Geography Game', 'Quiz', 'Trivia', 'Campus Exploration', 'Puzzle'],
  operatingSystem: 'All',
  inLanguage: 'en',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  author: {
    '@type': 'Organization',
    name: 'Campus Geo',
    url: 'https://campusgeo.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${plusJakarta.variable} ${jetbrainsMono.variable} bg-[#080b11]`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans min-h-full h-full bg-[#080b11] text-slate-100 flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}


