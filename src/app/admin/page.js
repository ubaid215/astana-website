'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import UserList from '@/components/admin/tables/UserList';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';
import AdminGuard from '@/components/admin/AdminGuard';

// Lazy load PaymentNotifications
const PaymentNotifications = dynamic(() => import('@/components/admin/PaymentNotifications'), {
  ssr: false,
  loading: () => <p>Loading notifications...</p>,
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
    return <div className="min-h-screen bg-background p-6 text-center ml-0 md:ml-64">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 text-center text-red-600 ml-0 md:ml-64">{error}</div>;
  }

  return (
    <AdminGuard>
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserList
            initialParticipations={paginatedParticipations}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
          <Suspense fallback={<p>Loading notifications...</p>}>
            <PaymentNotifications notifications={notifications} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-secondary mb-4">Quick Stats</h2>
            <p className="text-gray-600">Total Users: {participations.length}</p>
            <p className="text-gray-600">Total Slots: {slots.length}</p>
            <Button asChild className="mt-4 bg-primary text-white">
              <Link href="/admin/reports">View Reports</Link>
            </Button>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-secondary mb-4">Recent Slots</h2>
            {slots.slice(0, 3).map((slot) => (
              <p key={slot._id} className="text-gray-600">
                Day {slot.day}: {slot.timeSlot} ({slot.cowQuality})
              </p>
            ))}
            <Button asChild className="mt-4 bg-primary text-white">
              <Link href="/admin/slots">View All Slots</Link>
            </Button>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-secondary mb-4">Manage Payments</h2>
            <Button asChild className="mt-4 bg-primary text-white">
              <Link href="/admin/payments">View Payments</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}