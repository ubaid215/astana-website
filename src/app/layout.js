import './globals.css';
import { Inter } from 'next/font/google';
import SessionProviderWrapper from '@/components/providers/SessionProviderWrapper';
import { ToastProvider } from '@/components/ui/use-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Astana Aliya',
  description: 'Your app description',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}