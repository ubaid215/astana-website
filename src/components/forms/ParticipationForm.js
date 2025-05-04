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
  const { prices, setPrices } = useSocket();
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

  useEffect(() => {
    // Fetch initial prices
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        if (res.ok) {
          setPrices(data);
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      }
    };
    if (!prices) {
      fetchPrices();
    }
  }, [prices, setPrices]);

  useEffect(() => {
    if (prices && formData.cowQuality && formData.shares) {
      const price = prices[formData.cowQuality.toLowerCase()];
      setFormData((prev) => ({
        ...prev,
        totalAmount: price * formData.shares,
      }));
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
      const data = await res.json();
      if (res.ok) {
        router.push(`/confirmation?participationId=${data.participationId}`);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary text-center">Participation Form</h2>
      {error && <p className="text-red-600 text-center">{error}</p>}
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
          value={formData.day}
          onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select day" />
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
      {formData.members.map((member, index) => (
        <div key={index}>
          <label htmlFor={`member-${index}`} className="block text-sm font-medium">Member {index + 1} Name</label>
          <Input
            id={`member-${index}`}
            value={member}
            onChange={(e) => handleMemberChange(index, e.target.value)}
            required
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium">Total Amount</label>
        <Input
          value={formData.totalAmount.toLocaleString()}
          disabled
          className="bg-gray-100"
        />
      </div>
      <Button type="submit" className="w-full bg-primary text-white" disabled={loading || !prices}>
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}