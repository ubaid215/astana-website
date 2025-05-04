'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Error page triggered:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold text-primary mb-4">Something Went Wrong</h1>
      <p className="text-lg text-gray-600 mb-8">
        An unexpected error occurred. Please try again or contact support.
      </p>
      <div className="space-x-4">
        <Button onClick={reset} className="bg-primary text-white">
          Try Again
        </Button>
        <Button asChild className="bg-secondary text-white">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}