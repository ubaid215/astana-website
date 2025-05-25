'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/components/ui/use-toast';
import { FaCopy } from 'react-icons/fa';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { participations, setParticipations, socket, connected } = useSocket();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    participationId: '',
    transactionId: '',
    screenshot: null,
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [completionNotification, setCompletionNotification] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (res.ok) {
          const participationsData = Array.isArray(data) ? data : data.participations || [];
          console.log('[ProfilePage] Fetched participations:', participationsData);
          setParticipations(participationsData);

          // Check if any participation is linked to a completed slot
          const hasCompletedSlot = participationsData.some(p => p.slotAssigned && p.completed === true);
          console.log('[ProfilePage] Checked for completed slots:', { hasCompletedSlot, participationsData });
          if (hasCompletedSlot) {
            console.log('[ProfilePage] Found completed slot on fetch');
            setCompletionNotification('Your Qurbani has been done!');
          }
        } else {
          console.error('[ProfilePage] API error:', data.error);
          setError(data.error || 'Failed to load profile');
        }
      } catch (err) {
        console.error('[ProfilePage] Fetch error:', err);
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, setParticipations]);

  useEffect(() => {
    if (!socket || !connected) {
      console.warn('[ProfilePage] Socket not connected, skipping event listeners');
      return;
    }

    const handleSlotCompleted = ({ slotId, completed, userId }) => {
      console.log('[ProfilePage] Slot completed event received:', { slotId, completed, userId });
      console.log('[ProfilePage] Session user ID:', session?.user?.id);
      if (session?.user?.id === userId) {
        console.log('[ProfilePage] User ID matched, completed:', completed);
        if (completed) {
          setCompletionNotification('Your Qurbani has been done!');
          toast({
            title: 'Qurbani Completed',
            description: 'Your Qurbani has been successfully completed.',
            variant: 'success',
          });
          // Update participations to reflect completed status
          setParticipations((prev) =>
            prev.map((p) =>
              p.slotId === slotId ? { ...p, completed: true } : p
            )
          );
        }
      } else {
        console.log('[ProfilePage] User ID did not match:', { sessionUserId: session?.user?.id, eventUserId: userId });
      }
    };

    socket.on('slotCompleted', handleSlotCompleted);

    return () => {
      socket.off('slotCompleted', handleSlotCompleted);
      console.log('[ProfilePage] Cleaned up socket event listeners');
    };
  }, [socket, connected, session, toast, setParticipations]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.participationId || !paymentForm.transactionId) {
      setFormError('Please select a participation and provide a transaction ID');
      return;
    }

    const formData = new FormData();
    formData.append('participationId', paymentForm.participationId);
    formData.append('transactionId', paymentForm.transactionId);
    if (paymentForm.screenshot) {
      formData.append('screenshot', paymentForm.screenshot);
    }

    console.log('[ProfilePage] Sending FormData:', {
      participationId: paymentForm.participationId,
      transactionId: paymentForm.transactionId,
      screenshot: paymentForm.screenshot ? paymentForm.screenshot.name : null,
    });

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFormError('');
        setFormSuccess(`Payment submitted successfully for Participation ID: ${paymentForm.participationId}. Awaiting admin confirmation.`);
        setPaymentForm({ participationId: '', transactionId: '', screenshot: null });
      } else {
        console.error('[ProfilePage] Payment submission error:', data.error);
        setFormError(data.error || 'Failed to submit payment');
      }
    } catch (err) {
      console.error('[ProfilePage] Fetch error:', err);
      setFormError('Server error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Participation ID copied to clipboard');
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold text-primary mb-8">User Profile</h1>
      {completionNotification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-sm shadow-sm">
          <h3 className="text-lg font-semibold text-green-800">Qurbani Status</h3>
          <p className="text-green-700">{completionNotification}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Participations</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participation ID</TableHead>
                  <TableHead>Collector Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Cow Quality</TableHead>
                  {/* <TableHead>Day</TableHead> */}
                  {/* <TableHead>Time Slot</TableHead> */}
                  <TableHead>Shares</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Slot Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(participations) && participations.length > 0 ? (
                  participations.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{p._id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(p._id)}
                            title="Copy Participation ID"
                          >
                            <FaCopy />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{p.collectorName}</TableCell>
                      <TableCell>
                        {Array.isArray(p.members) && p.members.length > 0 ? p.members.join(', ') : 'N/A'}
                      </TableCell>
                      <TableCell>{p.cowQuality}</TableCell>
                      {/* <TableCell>Day {p.day}</TableCell> */}
                      {/* <TableCell>{p.timeSlot || 'Not Assigned'}</TableCell> */}
                      <TableCell>{p.shares}</TableCell>
                      <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{p.paymentStatus}</TableCell>
                      <TableCell>{p.slotAssigned ? 'Assigned' : 'Not Assigned'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      No participations yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Submit Payment</h2>
            <p className="text-gray-600 mb-4">
              Select a Participation ID from the table above to submit payment details.
            </p>
            {formError && <p className="text-red-600 mb-4">{formError}</p>}
            {formSuccess && <p className="text-green-600 mb-4">{formSuccess}</p>}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label htmlFor="participationId" className="block text-sm font-medium">
                  Participation ID
                </label>
                <Select
                  value={paymentForm.participationId}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, participationId: value })}
                  required
                >
                  <SelectTrigger id="participationId">
                    <SelectValue placeholder="Select Participation ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(participations) && participations.length > 0 ? (
                      participations.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p._id} ({p.collectorName}, {p.cowQuality}
                          {Array.isArray(p.members) && p.members.length > 0
                            ? `, Members: ${p.members.join(', ')}`
                            : ''})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No participations available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="transactionId" className="block text-sm font-medium">
                  Transaction ID
                </label>
                <Input
                  id="transactionId"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium">
                  Screenshot of payment
                </label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/jpeg,image/png"
                  required
                  onChange={(e) => setPaymentForm({ ...paymentForm, screenshot: e.target.files[0] })}
                />
              </div>
              <Button type="submit" className="bg-primary text-white">
                Submit Payment
              </Button>
            </form>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Payments</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participation ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Screenshot</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(participations) && participations.length > 0 ? (
                  participations.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p._id}</TableCell>
                      <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{p.paymentStatus}</TableCell>
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
                      <TableCell>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No payments yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Payment Account Details</h2>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-primary flex items-center">
                  Meezan Bank
                </h4>
                <p className="text-sm text-primary">Account Title: Munawar Hussnain</p>
                <p className="text-sm font-medium">IBAN Number:</p>
                <p className="text-sm">PK40MEZN0004170110884115</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-primary">Western Union</h4>
                <p className="text-sm font-medium"><strong>Payment send by Name or Western Union</strong></p>
                <p>Receiver Name</p>
                <p className="text-sm"><b>Name:</b> Muhammad Ubaidullah</p>
                <p className="text-sm font-medium"><b>ID Card Number:</b></p>
                <p className="text-sm">35501-0568066-3</p>
                <p className="text-sm font-medium"><b>Phone:</b> +92321-7677062</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Account Details</h2>
            <p className="text-gray-600">Name: {session?.user?.name}</p>
            <p className="text-gray-600">Email: {session?.user?.email}</p>
            <Button className="mt-4 bg-primary text-white">Edit Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';