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
      
      if (!res.ok) {
        throw new Error(await res.text());
      }

      setParticipations(prev =>
        prev.map(p => 
          p._id === participationId 
            ? { ...p, paymentStatus: newStatus, paymentDate: new Date() } 
            : p
        )
      );
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update status');
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
      });
      setNotifications([]);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
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

  const filteredParticipations = participations.filter(p => {
    if (filter === 'all') return true;
    return p.paymentStatus === filter;
  });

  return (
    <div className="p-6 space-y-6">
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
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipations.length > 0 ? (
              filteredParticipations.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p._id}</TableCell>
                  <TableCell>{p.userId?.name || 'Unknown'}</TableCell>
                  <TableCell>${p.totalAmount.toLocaleString()}</TableCell>
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
                    {p.screenshot ? (
                      <a 
                        href={p.screenshot} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    ) : 'N/A'}
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
                <TableCell colSpan={7} className="text-center">
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
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No new payment notifications
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((n) => (
        <div key={n._id || n.timestamp} className="border-b pb-4 last:border-0">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">
                {n.userName} submitted payment ({n.amount ? `$${n.amount.toLocaleString()}` : 'N/A'})
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
          {n.screenshot && (
            <a
              href={n.screenshot}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-blue-600 hover:underline"
            >
              View Payment Proof
            </a>
          )}
        </div>
      ))}
    </div>
  );
}