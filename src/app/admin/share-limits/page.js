'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSocket } from '@/hooks/useSocket';

export default function ShareLimitsForm() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const [shareLimits, setShareLimits] = useState({
    standard: 7,
    medium: 7,
    premium: 7,
    participatedShares: { standard: 0, medium: 0, premium: 0 },
    remainingShares: { standard: 7, medium: 7, premium: 7 },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShareLimits = async () => {
      try {
        const res = await fetch('/api/admin/share-limits');
        if (!res.ok) throw new Error('Failed to fetch share limits');
        const data = await res.json();
        setShareLimits({
          standard: data.standard ?? 7,
          medium: data.medium ?? 7,
          premium: data.premium ?? 7,
          participatedShares: data.participatedShares ?? { standard: 0, medium: 0, premium: 0 },
          remainingShares: data.remainingShares ?? {
            standard: data.standard - (data.participatedShares?.standard || 0),
            medium: data.medium - (data.participatedShares?.medium || 0),
            premium: data.premium - (data.participatedShares?.premium || 0),
          },
        });
      } catch (err) {
        setError('Failed to load share limits');
      }
    };
    fetchShareLimits();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('shareLimitsUpdated', (newLimits) => {
        setShareLimits({
          standard: newLimits.standard ?? 7,
          medium: newLimits.medium ?? 7,
          premium: newLimits.premium ?? 7,
          participatedShares: newLimits.participatedShares ?? { standard: 0, medium: 0, premium: 0 },
          remainingShares: newLimits.remainingShares ?? {
            standard: newLimits.standard - (newLimits.participatedShares?.standard || 0),
            medium: newLimits.medium - (newLimits.participatedShares?.medium || 0),
            premium: newLimits.premium - (newLimits.participatedShares?.premium || 0),
          },
        });
      });
      return () => socket.off('shareLimitsUpdated');
    }
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || !session.user.isAdmin) {
      setError('Unauthorized');
      return;
    }

    const data = {
      standard: parseInt(shareLimits.standard),
      medium: parseInt(shareLimits.medium),
      premium: parseInt(shareLimits.premium),
    };

    if (
      isNaN(data.standard) ||
      isNaN(data.medium) ||
      isNaN(data.premium) ||
      data.standard < (shareLimits.participatedShares.standard || 0) ||
      data.medium < (shareLimits.participatedShares.medium || 0) ||
      data.premium < (shareLimits.participatedShares.premium || 0)
    ) {
      setError('Share limits must be numbers and cannot be less than participated shares');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/share-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update share limits');
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update share limits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Set Share Limits</h2>
      <p className="text-sm text-gray-600 mb-4">Set to 0 to close a cow quality.</p>
      {error && <div className="mb-4 p-2 bg-red-100 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Standard Max Shares</label>
          <Input
            type="number"
            min={shareLimits.participatedShares.standard || 0}
            value={shareLimits.standard}
            onChange={(e) => setShareLimits({ ...shareLimits, standard: e.target.value })}
            required
            className="w-full border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Participated: {shareLimits.participatedShares.standard} shares, Remaining: {shareLimits.remainingShares.standard} shares
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium">Medium Max Shares</label>
          <Input
            type="number"
            min={shareLimits.participatedShares.medium || 0}
            value={shareLimits.medium}
            onChange={(e) => setShareLimits({ ...shareLimits, medium: e.target.value })}
            required
            className="w-full border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Participated: {shareLimits.participatedShares.medium} shares, Remaining: {shareLimits.remainingShares.medium} shares
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium">Premium Max Shares</label>
          <Input
            type="number"
            min={shareLimits.participatedShares.premium || 0}
            value={shareLimits.premium}
            onChange={(e) => setShareLimits({ ...shareLimits, premium: e.target.value })}
            required
            className="w-full border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">
            Participated: {shareLimits.participatedShares.premium} shares, Remaining: {shareLimits.remainingShares.premium} shares
          </p>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className={`w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Saving...' : 'Save Share Limits'}
        </Button>
      </form>
    </div>
  );
}