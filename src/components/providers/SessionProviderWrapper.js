'use client';

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function SessionProviderWrapper({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('/(main)')) {
      // Handle any legacy /(main) routes
      window.location.href = pathname.replace('/(main)', '');
    }
  }, [pathname]);

  return <SessionProvider basePath="/api/auth">{children}</SessionProvider>;
}