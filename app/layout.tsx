import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobHunt - Find Your Next Job',
  description: 'Browse and apply for the latest job opportunities',
  keywords: 'jobs, employment, career',
  openGraph: {
    title: 'JobHunt - Find Your Next Job',
    description: 'Browse and apply for the latest job opportunities',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
          crossOrigin="anonymous"
        ></script>
        {process.env.NEXT_PUBLIC_ENABLE_ADS === 'true' && (
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXX"
    crossOrigin="anonymous"
  />
)}
      </head>
      <body className="bg-gray-50">
        <Header />
        {/* <main className="container mx-auto px-4 py-8"> */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}