"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { v4 as uuidv4 } from 'uuid';

export default function VerifyEmailPage({ searchParams }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null); // Store token in state

  useEffect(() => {
    // Extract token safely inside useEffect
    const tokenFromParams = searchParams?.token;
    setToken(tokenFromParams); // Update state with token

    const requestId = uuidv4(); // Unique ID for tracking this request
    console.log(`[${requestId}] VerifyEmailPage loaded at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Token from URL: ${tokenFromParams}`);

    const verifyEmail = async () => {
      if (!tokenFromParams) {
        console.error(`[${requestId}] No verification token provided`);
        setError('No verification token provided');
        return;
      }

      setLoading(true);
      try {
        console.log(`[${requestId}] Sending verification request for token: ${tokenFromParams}`);
        const res = await fetch(`/api/auth/verify-email?token=${tokenFromParams}`);
        const data = await res.json();
        console.log(`[${requestId}] Verification response:`, {
          status: res.status,
          data
        });

        if (res.ok) {
          console.log(`[${requestId}] Verification successful: ${data.message}`);
          setMessage(data.message);
          setError('');
        } else {
          console.error(`[${requestId}] Verification failed: ${data.error || 'Unknown error'}`);
          setError(data.error || 'Verification failed');
          setMessage('');
        }
      } catch (err) {
        console.error(`[${requestId}] Server error during verification:`, {
          message: err.message,
          stack: err.stack
        });
        setError('Server error');
        setMessage('');
      } finally {
        setLoading(false);
        console.log(`[${requestId}] Verification process completed`);
      }
    };

    verifyEmail();
  }, [searchParams]); 

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary">Verify Email</h1>
        {loading && <p className="text-center text-gray-600">Verifying...</p>}
        {message && <p className="text-center text-green-600">{message}</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        <div className="mt-4 text-center">
          <Button asChild variant="link" className="text-white cursor-pointer">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}