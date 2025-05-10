'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSocket } from '@/hooks/useSocket';

export default function AdminPaymentsPage() {
  const { participations, setParticipations, notifications, setNotifications } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        const res = await fetch('/api/admin/payments');
        const data = await res.json();
        if (res.ok) {
          console.log('[AdminPayments] Fetched participations:', data);
          setParticipations(data || []);
        } else {
          console.error('[AdminPayments] API error:', data.error);
          setError(data.error || 'Failed to load payments data');
        }
      } catch (err) {
        console.error('[AdminPayments] Fetch error:', err);
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsData();
  }, [setParticipations]);

  const handleStatusUpdate = async (participationId, newStatus) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participationId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('[AdminPayments] Status updated:', { participationId, newStatus });
        setParticipations((prev) =>
          prev.map((p) =>
            p._id === participationId ? { ...p, paymentStatus: newStatus, paymentDate: new Date() } : p
          )
        );
      } else {
        console.error('[AdminPayments] Status update error:', data.error);
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('[AdminPayments] Fetch error:', err);
      alert('Server error');
    }
  };

  const clearNotifications = () => {
    console.log('[AdminPayments] Clearing notifications');
    setNotifications([]);
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-center ml- Internationally, this is ambiguous, but in this context, it likely refers to margin-left: 64px for medium-sized screens and above, and margin-left: 0 for smaller screens. ">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 text-center text-red-600 ml-0 md:ml-64">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">Manage Payments</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-secondary mb-4">Payment Records</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participation ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participations.length > 0 ? (
              participations.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>{p._id}</TableCell>
                  <TableCell>{p.userId?.name || 'Unknown'}</TableCell>
                  <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{p.transactionId || 'N/A'}</TableCell>
                  <TableCell>
                    {p.screenshot ? (
                      <a href={p.screenshot} target="_blank" className="text-blue-600 hover:underline">
                        View
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{p.paymentStatus}</TableCell>
                  <TableCell>
                    <Select
                      value={p.paymentStatus}
                      onValueChange={(value) => handleStatusUpdate(p._id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Button asChild className="mt-4 bg-primary text-white">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary">Payment Notifications</h2>
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearNotifications}>
              Clear Notifications
            </Button>
          )}
        </div>
        <PaymentNotifications notifications={notifications} />
      </div>
    </div>
  );
}

function PaymentNotifications({ notifications }) {
  return (
    <div>
      {notifications.length > 0 ? (
        <ul className="space-y-4">
          {notifications.map((n, index) => (
            <li key={index} className="border-b pb-2">
              <p className="text-gray-600">
                <strong>{n.userName}</strong> submitted payment for Participation ID:{' '}
                <strong>{n.participationId}</strong>
              </p>
              <p className="text-gray-600">Transaction ID: {n.transactionId}</p>
              {n.screenshot && (
                <p>
                  <a href={n.screenshot} target="_blank" className="text-blue-600 hover:underline">
                    View Screenshot
                  </a>
                </p>
              )}
              <p className="text-gray-500 text-sm">{new Date(n.timestamp).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No payment notifications yet</p>
      )}
    </div>
  );
}