'use client';

import Sidebar from '@/components/admin/Sidebar';
import { usePathname } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-background flex">
      {isLoginPage ? (
        <div className="flex-1">{children}</div>
      ) : (
        <>
          <Sidebar />
          <div className="flex-1">
            <AdminGuard>{children}</AdminGuard>
          </div>
        </>
      )}
    </div>
  );
}