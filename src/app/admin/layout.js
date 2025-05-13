'use client';

import Sidebar from '@/components/admin/Sidebar';
import { usePathname } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';
import { NotificationBadge } from '@/components/NotificationBadge';

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
          <div className="flex-1 flex flex-col">
            {/* New header with notification badge */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
              <div className="px-4 py-3 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                <div className="flex items-center gap-2">
                  <NotificationBadge />
                </div>
              </div>
            </header>
            
            {/* Main content area (unchanged) */}
            <main className="flex-1 overflow-auto">
              <AdminGuard>{children}</AdminGuard>
            </main>
          </div>
        </>
      )}
    </div>
  );
}