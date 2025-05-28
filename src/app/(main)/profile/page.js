'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/components/ui/use-toast';
import { FaCopy } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { format } from 'date-fns';

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
    screenshots: [],
    installmentNumber: '1', // Added for installment/half-payment
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [qurbaniCompletions, setQurbaniCompletions] = useState([]);

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    // If the screenshot is already an absolute URL, return it
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      return screenshot;
    }
    // Use relative path for local uploads
    const cleanPath = screenshot.replace(/^\/*(uploads\/)?/, '');
    const url = `/uploads/${cleanPath}`;
    console.log('[ProfilePage] Generated screenshot URL:', url);
    return url;
  };

  const refreshProfileData = async () => {
    try {
      console.log('[ProfilePage] Refreshing profile data...');
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok) {
        const participationsData = Array.isArray(data.participations) ? data.participations : [];
        console.log('[ProfilePage] Updated participations:', participationsData);
        setParticipations(participationsData);

        const completionsData = Array.isArray(data.qurbaniCompletions) ? data.qurbaniCompletions : [];
        console.log('[ProfilePage] Updated qurbani completions:', completionsData);
        setQurbaniCompletions(completionsData);

        if (completionsData.length > qurbaniCompletions.length) {
          toast({
            title: 'Profile Updated',
            description: 'Your Qurbani completion status has been updated!',
            variant: 'success',
          });
        }
      } else {
        console.error('[ProfilePage] API error:', data.error);
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('[ProfilePage] Refresh error:', err);
    }
  };

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
          const participationsData = Array.isArray(data.participations) ? data.participations : [];
          console.log('[ProfilePage] Fetched participations:', participationsData);
          setParticipations(participationsData);

          const completionsData = Array.isArray(data.qurbaniCompletions) ? data.qurbaniCompletions : [];
          console.log('[ProfilePage] Fetched qurbani completions:', completionsData);
          setQurbaniCompletions(completionsData);
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
    if (!socket || !connected || !session?.user?.id) {
      console.warn('[ProfilePage] Socket not connected or no user session, skipping event listeners');
      return;
    }

    console.log('[ProfilePage] Setting up socket listeners for user:', session.user.id);

    const handleQurbaniCompleted = ({ userId, completion }) => {
      console.log('[ProfilePage] Qurbani completed event received:', { userId, completion, sessionUserId: session?.user?.id });
      if (session?.user?.id === userId) {
        console.log('[ProfilePage] User ID matched, refreshing profile data');
        refreshProfileData();
        toast({
          title: 'Qurbani Completed! 🎉',
          description: completion.message || 'Your Qurbani has been completed successfully!',
          variant: 'success',
        });
      }
    };

    const handleSlotCompleted = ({ slotId, completed, day }) => {
      console.log('[ProfilePage] Slot completed event received:', { slotId, completed, day });
      refreshProfileData();
    };

    socket.on('qurbaniCompleted', handleQurbaniCompleted);
    socket.on('slotCompleted', handleSlotCompleted);

    return () => {
      socket.off('qurbaniCompleted', handleQurbaniCompleted);
      socket.off('slotCompleted', handleSlotCompleted);
      console.log('[ProfilePage] Cleaned up socket event listeners');
    };
  }, [socket, connected, session, toast, qurbaniCompletions.length, refreshProfileData]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const intervalId = setInterval(() => {
      console.log('[ProfilePage] Periodic profile refresh');
      refreshProfileData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [status, refreshProfileData]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.participationId || !paymentForm.transactionId || paymentForm.screenshots.length === 0) {
      setFormError('Please select a participation, provide a transaction ID, and upload at least one screenshot');
      return;
    }

    const formData = new FormData();
    formData.append('participationId', paymentForm.participationId);
    formData.append('transactionId', paymentForm.transactionId);
    formData.append('installmentNumber', paymentForm.installmentNumber); // Added for installment
    paymentForm.screenshots.forEach((screenshot, index) => {
      formData.append('screenshot', screenshot);
    });

    console.log('[ProfilePage] Sending FormData:', {
      participationId: paymentForm.participationId,
      transactionId: paymentForm.transactionId,
      installmentNumber: paymentForm.installmentNumber,
      screenshots: paymentForm.screenshots.map(s => s.name),
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
        setPaymentForm({ participationId: '', transactionId: '', screenshots: [], installmentNumber: '1' });
        document.getElementById('screenshot').value = ''; // Reset file input
        refreshProfileData();
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
    toast({
      title: 'Copied',
      description: 'Participation ID copied to clipboard',
      variant: 'success',
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">User Profile</h1>
        <Button
          onClick={refreshProfileData}
          variant="outline"
          size="sm"
          className="bg-blue-50 hover:bg-blue-100"
        >
          🔄 Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Qurbani Completions</h2>
            {qurbaniCompletions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🐄</div>
                <p className="text-gray-600">No Qurbani completions recorded yet.</p>
                <p className="text-sm text-gray-500 mt-2">Your completions will appear here once the admin marks your slot as complete.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {qurbaniCompletions.map((completion, index) => (
                  <div
                    key={`${completion.slotId}-${index}`}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800 flex items-center">
                          ✅ {completion.message}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Collector:</strong> {completion.collectorName}
                        </p>
                        {completion.participantNames?.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <strong>Participants:</strong> {completion.participantNames.join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <strong>Slot:</strong> Day {completion.day}, {completion.timeSlot}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Cow Quality:</strong> {completion.cowQuality}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Completed on:</strong> {new Date(completion.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-2xl">🎉</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Participations</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participation ID</TableHead>
                    <TableHead>Collector Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Cow Quality</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Slot Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(participations) && participations.length > 0 ? (
                    participations.map((p) => {
                      const isCompleted = p.slotId?.completed || false;
                      return (
                        <TableRow key={p._id} className={isCompleted ? 'bg-green-50' : ''}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm">{p._id}</span>
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
                          <TableCell className="font-medium">{p.collectorName}</TableCell>
                          <TableCell>
                            {Array.isArray(p.members) && p.members.length > 0 ? p.members.join(', ') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                              {p.cowQuality}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {p.shares}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {p.totalAmount.toLocaleString()} PKR
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${p.paymentStatus === 'Completed'
                                  ? 'bg-green-100 text-green-800'
                                  : p.paymentStatus === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {p.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${isCompleted
                                  ? 'bg-green-100 text-green-800'
                                  : p.slotAssigned
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {isCompleted ? '✅ Completed' : p.slotAssigned ? 'Assigned' : 'Not Assigned'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          <div className="text-4xl mb-2">📝</div>
                          <p>No participations yet</p>
                          <p className="text-sm mt-1">Your participation records will appear here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Submit Payment</h2>
            <p className="text-gray-600 mb-4">
              Select a Participation ID from the table above to submit payment details.
            </p>
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600">{formError}</p>
              </div>
            )}
            {formSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-600">{formSuccess}</p>
              </div>
            )}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label htmlFor="participationId" className="block text-sm font-medium mb-2">
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
                <label htmlFor="transactionId" className="block text-sm font-medium mb-2">
                  Transaction ID
                </label>
                <Input
                  id="transactionId"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  placeholder="Enter your transaction ID"
                  required
                />
              </div>
              <div>
                <label htmlFor="installmentNumber" className="block text-sm font-medium mb-2">
                  Installment Number
                </label>
                <Select
                  value={paymentForm.installmentNumber}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, installmentNumber: value })}
                  required
                >
                  <SelectTrigger id="installmentNumber">
                    <SelectValue placeholder="Select Installment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Installment 1</SelectItem>
                    <SelectItem value="2">Installment 2</SelectItem>
                    <SelectItem value="3">Installment 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium mb-2">
                  Screenshots of payment
                </label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  multiple
                  onChange={(e) => setPaymentForm({ ...paymentForm, screenshots: Array.from(e.target.files) })}
                  required
                />
              </div>
              <Button type="submit" className="bg-primary text-white w-full">
                Submit Payment
              </Button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Payments</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participation ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proofs</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(participations) && participations.length > 0 ? (
                    participations.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-mono text-sm">{p._id}</TableCell>
                        <TableCell className="font-semibold">{p.totalAmount.toLocaleString()} PKR</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${p.paymentStatus === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : p.paymentStatus === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {p.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                          {p.paymentSubmissions?.length > 0 ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="link" className="text-blue-600 hover:underline">
                                  View ({p.paymentSubmissions.reduce((sum, sub) => sum + (sub.screenshots?.length || 0), 0)})
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Payment Proofs for Participation {p._id}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {p.paymentSubmissions.map((submission, subIndex) =>
                                    submission.screenshots?.map((screenshot, index) => {
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
                          {p.paymentDate ? format(new Date(p.paymentDate), 'PP') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <div className="text-gray-500">
                          <div className="text-3xl mb-2">💳</div>
                          <p>No payments yet</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Payment Account Details</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-primary flex items-center mb-2">
                  🏦 Meezan Bank
                </h4>
                <p className="text-sm text-primary"><strong>Account Title:</strong> Munawar Hussnain</p>
                <p className="text-sm font-medium mt-2">IBAN Number:</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">PK40MEZN0004170110884115</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-primary mb-2">🌍 Western Union</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Payment send by Name or Western Union</strong></p>
                  <p><strong>Receiver Name:</strong> Muhammad Ubaidullah</p>
                  <p><strong>ID Card Number:</strong> <span className="font-mono">35501-0568066-3</span></p>
                  <p><strong>Phone:</strong> <span className="font-mono">+92321-7677062</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-secondary mb-4">Account Details</h2>
            <div className="space-y-2">
              <p className="text-gray-600"><strong>Name:</strong> {session?.user?.name}</p>
              <p className="text-gray-600"><strong>Email:</strong> {session?.user?.email}</p>
            </div>
            <Button className="mt-4 bg-primary text-white" disabled>
              Edit Profile (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';