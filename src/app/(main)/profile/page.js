'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { FaCopy } from 'react-icons/fa';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { participations, setParticipations } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    participationId: '',
    transactionId: '',
    screenshot: null,
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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
          setParticipations(data);
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch (err) {
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, setParticipations]);

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

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFormError('');
        setFormSuccess(`Payment submitted successfully for Participation ID: ${paymentForm.participationId}`);
        setPaymentForm({ participationId: '', transactionId: '', screenshot: null });
      } else {
        setFormError(data.error || 'Failed to submit payment');
      }
    } catch (err) {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Participations</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participation ID</TableHead>
                  <TableHead>Collector Name</TableHead>
                  <TableHead>Cow Quality</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Slot Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participations.length > 0 ? (
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
                      <TableCell>{p.cowQuality}</TableCell>
                      <TableCell>Day {p.day}</TableCell>
                      <TableCell>{p.slotId?.timeSlot || 'Not Assigned'}</TableCell>
                      <TableCell>{p.shares}</TableCell>
                      <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{p.slotAssigned ? 'Assigned' : 'Not Assigned'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
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
                    {participations.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p._id} ({p.collectorName}, {p.cowQuality})
                      </SelectItem>
                    ))}
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
                  Screenshot (Optional)
                </label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/jpeg,image/png"
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
                {participations.length > 0 ? (
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