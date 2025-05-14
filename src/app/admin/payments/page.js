'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSocket } from '@/hooks/useSocket';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
  const { 
    participations, 
    setParticipations, 
    notifications, 
    setNotifications,
    connected 
  } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/payments?filter=${filter}`);
        const data = await res.json();
        if (res.ok) {
          setParticipations(data || []);
        } else {
          setError(data.error || 'Failed to load payments');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, setParticipations]);

  const handleStatusUpdate = async (participationId, newStatus) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participationId, status: newStatus }),
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update payment status');
        } else {
          const text = await res.text();
          console.error('[AdminPaymentsPage] Non-JSON response:', text.slice(0, 100));
          throw new Error('Server returned non-JSON response');
        }
      }

      const data = contentType && contentType.includes('application/json') 
        ? await res.json() 
        : {};

      setParticipations(prev =>
        prev.map(p =>
          p._id === participationId
            ? {
                ...p,
                paymentStatus: newStatus,
                paymentDate: new Date(),
                slotId: newStatus === 'Completed' ? data.slots?.[0] || null : null,
                timeSlot: newStatus === 'Completed' ? data.timeSlot || null : null,
                slotAssigned: newStatus === 'Completed' && !!data.slots?.length,
              }
            : p
        )
      );

      console.log('[AdminPaymentsPage] Status updated:', { participationId, newStatus, slots: data.slots });
    } catch (err) {
      console.error('[AdminPaymentsPage] Update failed:', err.message);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
      });
      setNotifications([]);
    } catch (err) {
      console.error('[AdminPaymentsPage] Failed to mark notifications as read:', err);
    }
  };

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      return screenshot;
    }
    
    const cleanPath = screenshot.replace(/^\/*(uploads\/)?/, '');
    const url = `${BASE_URL}/uploads/${cleanPath}`;
    
    console.log('[AdminPaymentsPage] Generated screenshot URL:', url, 'from:', screenshot);
    
    return url;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  const filteredParticipations = participations.filter(p => {
    if (filter === 'all') return true;
    return p.paymentStatus === filter;
  });

  return (
    <div className="p-6 space-y-6 ml-24">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="flex space-x-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participation ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Collector Name</TableHead>
              <TableHead>Cow Quality</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipations.length > 0 ? (
              filteredParticipations.map((p) => {
                const screenshotUrl = getScreenshotUrl(p.screenshot);
                return (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p._id}</TableCell>
                    <TableCell>{p.userId?.name || 'Unknown'}</TableCell>
                    <TableCell>{p.collectorName || 'N/A'}</TableCell>
                    <TableCell>{p.cowQuality || 'N/A'}</TableCell>
                    <TableCell>{p.timeSlot || 'Not Assigned'}</TableCell>
                    <TableCell>PKR {p.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      {p.paymentDate ? format(new Date(p.paymentDate), 'PP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        p.paymentStatus === 'Completed' ? 'success' :
                        p.paymentStatus === 'Rejected' ? 'destructive' : 'warning'
                      }>
                        {p.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {screenshotUrl ? (
                        <a 
                          href={screenshotUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={() => console.log('[AdminPaymentsPage] Opening screenshot:', screenshotUrl)}
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.paymentStatus}
                        onValueChange={(value) => handleStatusUpdate(p._id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Payment Notifications</h2>
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              onClick={markNotificationsAsRead}
              disabled={!connected}
            >
              Mark All as Read
            </Button>
          )}
        </div>
        <PaymentNotifications notifications={notifications} />
      </div>
    </div>
  );
}

function PaymentNotifications({ notifications }) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      return screenshot;
    }
    
    const cleanPath = screenshot.replace(/^\/*(uploads\/)?/, '');
    const url = `${BASE_URL}/uploads/${cleanPath}`;
    
    console.log('[PaymentNotifications] Generated screenshot URL:', url, 'from:', screenshot);
    
    return url;
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No new payment notifications
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((n) => {
        const screenshotUrl = getScreenshotUrl(n.screenshot);
        return (
          <div key={n._id || n.timestamp} className="border-b pb-4 last:border-0">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">
                  {n.userName} submitted payment ({n.amount ? `PKR ${n.amount.toLocaleString()}` : 'N/A'})
                </p>
                <p className="text-sm text-gray-600">
                  Participation ID: {n.participationId}
                </p>
                <p className="text-sm text-gray-600">
                  Transaction ID: {n.transactionId}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(n.timestamp), 'PPpp')}
              </div>
            </div>
            {screenshotUrl ? (
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                onClick={() => console.log('[PaymentNotifications] Opening screenshot:', screenshotUrl)}
              >
                View Payment Proof
              </a>
            ) : (
              <span className="inline-block mt-2 text-sm text-gray-500">No Proof Available</span>
            )}
          </div>
        );
      })}
    </div>
  );
}