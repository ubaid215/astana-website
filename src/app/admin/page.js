'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import UserList from '@/components/admin/tables/UserList';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';
import AdminGuard from '@/components/admin/AdminGuard';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy load PaymentNotifications
const PaymentNotifications = dynamic(() => import('@/components/admin/PaymentNotifications'), {
  ssr: false,
  loading: () => <div className="space-y-2 p-4">
    <Skeleton className="h-6 w-full" />
    <Skeleton className="h-6 w-3/4" />
  </div>,
});

export default function AdminDashboard() {
  const { participations, setParticipations, slots, setSlots, notifications } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.status === 401) {
          return;
        }
        const data = await res.json();
        if (res.ok) {
          setParticipations(data.participations || []);
          setSlots(data.slots || []);
        } else {
          setError(data.error || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [setParticipations, setSlots]);

  const paginatedParticipations = participations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(participations.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/admin/reports">Reports</Link>
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/admin/slots">Manage Slots</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary-dark text-white">
                <Link href="/admin/settings">Settings</Link>
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
                </div>
                <div className="overflow-x-auto">
                  <UserList
                    initialParticipations={paginatedParticipations}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                  />
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Payment Notifications</h2>
                </div>
                <Suspense fallback={
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                }>
                  <PaymentNotifications notifications={notifications} />
                </Suspense>
              </section>
            </main>

            <aside className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Total Users</span>
                    <span className="font-semibold text-blue-600">{participations.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Total Slots</span>
                    <span className="font-semibold text-green-600">{slots.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-600">Active Today</span>
                    <span className="font-semibold text-purple-600">
                      {participations.filter(p => p.lastActive === new Date().toISOString().split('T')[0]).length}
                    </span>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-6">
                  <Link href="/admin/reports">View Detailed Reports</Link>
                </Button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Slots</h2>
                <div className="space-y-3">
                  {slots.slice(0, 3).map((slot) => (
                    <div key={slot._id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <p className="font-medium text-gray-800">Day {slot.day}: {slot.timeSlot}</p>
                      <p className="text-sm text-gray-500">Quality: <span className="capitalize">{slot.cowQuality}</span></p>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full mt-6">
                  <Link href="/admin/slots">Manage All Slots</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}