"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { TIME_SLOTS } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function ParticipationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { socket, prices, setPrices } = useSocket();
  const [formData, setFormData] = useState({
    collectorName: '',
    whatsappNumber: '',
    country: '',
    cowQuality: '',
    timeSlot: '',
    day: '',
    shares: 1,
    members: [''],
    totalAmount: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch prices on initial load if not already in state
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/admin/prices');
        if (!res.ok) {
          throw new Error('Failed to fetch prices');
        }
        const data = await res.json();
        console.log('[ParticipationForm] Fetched initial prices:', data);
        setPrices(data);
      } catch (err) {
        console.error('[ParticipationForm] Failed to fetch prices:', err);
      }
    };

    if (!prices) {
      fetchPrices();
    }
  }, [prices, setPrices]);

  // Listen for price updates via Socket.IO
  useEffect(() => {
    if (socket) {
      console.log('[ParticipationForm] Setting up Socket.IO listener for pricesUpdated event');
      
      socket.on('pricesUpdated', (newPrices) => {
        console.log('[ParticipationForm] Prices updated via Socket.IO:', newPrices);
        setPrices(newPrices);
      });

      return () => {
        console.log('[ParticipationForm] Cleaning up Socket.IO listener');
        socket.off('pricesUpdated');
      };
    }
  }, [socket, setPrices]);

  // Update total amount when prices, cow quality, or shares change
  useEffect(() => {
    if (prices && formData.cowQuality && formData.shares) {
      const priceKey = formData.cowQuality.toLowerCase();
      if (prices[priceKey]) {
        const price = prices[priceKey];
        setFormData((prev) => ({
          ...prev,
          totalAmount: price * formData.shares,
        }));
      }
    }
  }, [formData.cowQuality, formData.shares, prices]);

  const handleSharesChange = (value) => {
    const shares = parseInt(value) || 1;
    setFormData((prev) => ({
      ...prev,
      shares,
      members: Array(shares).fill('').map((_, i) => prev.members[i] || ''),
    }));
  };

  const handleMemberChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? value : m)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      setError('Please log in to submit the form');
      return;
    }
    if (formData.members.some((m) => !m)) {
      setError('Please fill all member names');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/participation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: session.user.id,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Submission failed');
      }
      
      router.push('/profile');
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
        <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-3xl font-bold text-primary text-center">Participation Form</h2>
          {error && <p className="text-red-600 text-center">{error}</p>}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="collectorName" className="block text-sm font-medium">Collector Name</label>
              <Input
                id="collectorName"
                value={formData.collectorName}
                onChange={(e) => setFormData({ ...formData, collectorName: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium">WhatsApp Number</label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium">Country</label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="cowQuality" className="block text-sm font-medium">Cow Quality</label>
              <Select
                value={formData.cowQuality}
                onValueChange={(value) => setFormData({ ...formData, cowQuality: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {prices ? (
                    <>
                      <SelectItem value="Standard">Standard ({prices.standard.toLocaleString()}/share)</SelectItem>
                      <SelectItem value="Medium">Medium ({prices.medium.toLocaleString()}/share)</SelectItem>
                      <SelectItem value="Premium">Premium ({prices.premium.toLocaleString()}/share)</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="loading">Loading prices...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="timeSlot" className="block text-sm font-medium">Time Slot (Optional)</label>
              <Select
                value={formData.timeSlot}
                onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="day" className="block text-sm font-medium">Day</label>
              <Select
                value={formData.day?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, day: parseInt(value) })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" value={formData.day?.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="shares" className="block text-sm font-medium">Number of Shares</label>
              <Input
                id="shares"
                type="number"
                min="1"
                value={formData.shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Total Amount</label>
              <Input
                value={formData.totalAmount.toLocaleString()}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.members.map((member, index) => (
              <div key={index}>
                <label htmlFor={`member-${index}`} className="block text-sm font-medium">Name Of Qurbani Recipient: {index + 1} </label>
                <Input
                  id={`member-${index}`}
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full bg-primary text-white mt-4" disabled={loading || !prices}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </form>

        <div className="lg:w-80 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-primary mb-4">Payment Account Details</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold flex items-center">
                Meezan Bank
              </h4>
              <p className="text-sm font-medium">IBAN Number:</p>
              <p className="text-sm">PK40MEZN0004170110884115</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-primary">Western Union</h4>
              <p className="text-sm font-medium "><strong>Payment send by Name or Western Union </strong></p>
              <p>Reciever Name </p>
              <p className="text-sm"><b>Name:</b> Muhammad Ubaidullah</p>
              <p className="text-sm font-medium"><b>ID Card Number:</b></p>
              <p className="text-sm">35501-0568066-3</p>
              <p className="text-sm font-medium"><b>Phone:</b> +92321-7677062</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}