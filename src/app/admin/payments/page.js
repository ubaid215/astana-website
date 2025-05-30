'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSocket } from '@/hooks/useSocket';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/use-toast';

export default function AdminPaymentsPage() {
  const {
    participations,
    setParticipations,
    notifications,
    setNotifications,
    connected,
  } = useSocket();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      return screenshot;
    }
    const cleanPath = screenshot.replace(/^\/*(uploads\/)?/, '');
    const url = `/uploads/${cleanPath}`;
    console.log('[AdminPaymentsPage] Generated screenshot URL:', url);
    return url;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/payments?filter=${filter}`);
        const data = await res.json();
        if (res.ok) {
          setParticipations(data || []);
          console.log('[AdminPaymentsPage] Fetched participations:', data);
        } else {
          setError(data.error || 'Failed to load payments');
        }
      } catch (err) {
        setError('Failed to connect to server');
        console.error('[AdminPaymentsPage] Fetch error:', err);
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update payment status');
      }

      const data = await res.json();

      setParticipations((prev) =>
        prev.map((p) =>
          p._id === participationId
            ? {
              ...p,
              paymentStatus: newStatus,
              paymentDate: newStatus === 'Completed' ? new Date() : p.paymentDate,
              slotId: newStatus === 'Completed' && data.slots?.length > 0 ? data.slots[0]._id : p.slotId,
              timeSlot: newStatus === 'Completed' ? data.timeSlot || p.timeSlot : p.timeSlot,
              slotAssigned: newStatus === 'Completed' && data.slots?.length > 0,
            }
            : p
        )
      );

      console.log('[AdminPaymentsPage] Status updated:', {
        participationId,
        newStatus,
        slots: data.slots?.map((s) => s._id),
        timeSlot: data.timeSlot,
      });

      toast({
        title: 'Success',
        description: `Payment status updated to ${newStatus}${newStatus === 'Completed' && data.slots?.length > 0 ? ' and slot allocated' : ''}.`,
        variant: 'success',
      });
    } catch (err) {
      console.error('[AdminPaymentsPage] Update failed:', err.message);
      toast({
        title: 'Error',
        description: `Failed to update status: ${err.message}`,
        variant: 'destructive',
      });
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete notifications');
      }

      const data = await res.json();
      setNotifications([]); // Clear all notifications from state
      console.log('[AdminPaymentsPage] Notifications deleted:', data);

      toast({
        title: 'Notifications Cleared',
        description: `${data.deletedCount} notifications deleted successfully.`,
        variant: 'success',
      });
    } catch (err) {
      console.error('[AdminPaymentsPage] Failed to delete notifications:', err);
      toast({
        title: 'Error',
        description: `Failed to delete notifications: ${err.message}`,
        variant: 'destructive',
      });
    }
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

  const filteredParticipations = participations.filter((p) => {
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
              <TableHead>Proofs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipations.length > 0 ? (
              filteredParticipations.map((p) => (
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
                    <Badge
                      variant={
                        p.paymentStatus === 'Completed'
                          ? 'success'
                          : p.paymentStatus === 'Rejected'
                            ? 'destructive'
                            : 'warning'
                      }
                    >
                      {p.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.paymentSubmissions?.length > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-blue-600 hover:underline">
                            View ({p.paymentSubmissions.reduce((sum, sub) => sum + (sub.allScreenshots?.length || 0), 0)})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Payment Proofs for Participation {p._id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {p.paymentSubmissions.map((submission, subIndex) =>
                              submission.allScreenshots?.map((screenshot, index) => {
                                const screenshotUrl = getScreenshotUrl(screenshot);
                                return (
                                  <div key={`${subIndex}-${index}`} className="border-b pb-4 last:border-b-0">
                                    <p className="text-sm font-medium">
                                      Proof {index + 1} (Installment {submission.installmentNumber || 1}) - Transaction ID: {submission.transactionId}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Submitted on: {format(new Date(submission.submittedAt), 'PPpp')}
                                    </p>
                                    {screenshotUrl ? (
                                      <a
                                        href={screenshotUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2"
                                      >
                                        <Image
                                          src={screenshotUrl}
                                          alt={`Payment proof ${index + 1}`}
                                          width={300}
                                          height={200}
                                          className="max-w-full h-auto max-h-64 rounded"
                                        />
                                      </a>
                                    ) : (
                                      <span className="text-gray-500">No screenshot available</span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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
              ))
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
  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      return screenshot;
    }
    const cleanPath = screenshot.replace(/^\/*(uploads\/)?/, '');
    const url = `/uploads/${cleanPath}`;
    console.log('[PaymentNotifications] Generated screenshot URL:', url);
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
      {notifications.map((n, nIndex) => (
        <div key={n._id || nIndex} className="border-b pb-4 last:border-0">
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
              {n.installmentNumber && (
                <p className="text-sm text-gray-600">
                  Installment: {n.installmentNumber}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(n.createdAt || n.timestamp), 'PPpp')}
            </div>
          </div>
          {n.allScreenshots?.length > 0 ? (
            n.allScreenshots.map((screenshot, index) => {
              const screenshotUrl = getScreenshotUrl(screenshot);
              return (
                <a
                  key={index}
                  href={screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                  onClick={() => console.log('[PaymentNotifications] Opening screenshot:', screenshotUrl)}
                >
                  View Proof {index + 1} (Installment {n.installmentNumber || 1})
                </a>
              );
            })
          ) : (
            <span className="inline-block mt-2 text-sm text-gray-500">No Proof Available</span>
          )}
        </div>
      ))}
    </div>
  );
}