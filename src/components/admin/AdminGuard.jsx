'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.isAdmin) {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen bg-background p-6 text-center">Loading...</div>;
  }

  if (!session?.user?.isAdmin) {
    return <div className="min-h-screen bg-background p-6 text-center">Redirecting to login...</div>;
  }

  return children;
}