import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SessionProviderWrapper from '@/components/providers/SessionProviderWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Astana Aliya - Murshidabad Shareef',
  description: 'Participate in Eid ul Adha with ease and transparency.',
  openGraph: {
    title: 'Eid ul Adha Participation System',
    description: 'Join our platform to participate in Eid ul Adha slaughter.',
    url: 'https://your-domain.com',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <Header />
          <main>{children}</main>
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}