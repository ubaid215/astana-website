"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { v4 as uuidv4 } from 'uuid';

export default function VerifyEmailPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    const requestId = uuidv4();
    console.log(`[${requestId}] VerifyEmailPage loaded at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Token from URL: ${token}`);

    const verifyEmail = async () => {
      if (!token) {
        console.error(`[${requestId}] No verification token provided`);
        setError('No verification token provided');
        return;
      }

      setLoading(true);
      try {
        console.log(`[${requestId}] Sending verification request for token: ${token}`);
        
        // Use absolute URL for API call to ensure it works in both environments
        const apiUrl = `${window.location.origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
        console.log(`[${requestId}] API URL: ${apiUrl}`);
        
        const res = await fetch(apiUrl, {
          cache: 'no-store'
        });
        
        const data = await res.json();
        console.log(`[${requestId}] Verification response:`, {
          status: res.status,
          data
        });

        if (res.ok) {
          setMessage(data.message || 'Email verified successfully!');
          setError('');
        } else {
          setError(data.error || 'Verification failed');
          setMessage('');
        }
      } catch (err) {
        console.error(`[${requestId}] Server error during verification:`, {
          message: err.message,
          stack: err.stack
        });
        setError('Server error during verification');
        setMessage('');
      } finally {
        setLoading(false);
        console.log(`[${requestId}] Verification process completed`);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary">
          {loading ? 'Verifying Email...' : 'Verify Email'}
        </h1>
        {loading && <p className="text-center text-gray-600">Verifying...</p>}
        {message && (
          <p className="text-center text-green-600 mb-4">{message}</p>
        )}
        {error && (
          <p className="text-center text-red-600 mb-4">{error}</p>
        )}
        <div className="mt-4 text-center">
          <Button asChild variant="default">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}