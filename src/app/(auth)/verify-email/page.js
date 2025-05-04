"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailPage({ searchParams }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!searchParams?.token) {
        setError('No verification token provided');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/auth/verify-email?token=${searchParams.token}`);
        const data = await res.json();
        if (res.ok) {
          setMessage(data.message);
          setError('');
        } else {
          setError(data.error || 'Verification failed');
          setMessage('');
        }
      } catch (err) {
        setError('Server error');
        setMessage('');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams?.token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary">Verify Email</h1>
        {loading && <p className="text-center text-gray-600">Verifying...</p>}
        {message && <p className="text-center text-green-600">{message}</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        <div className="mt-4 text-center">
          <Button asChild variant="link" className="text-primary">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}