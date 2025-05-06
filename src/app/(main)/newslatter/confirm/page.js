"use client";

import { useEffect, useState } from 'react';
import connectDB from '@/lib/db/mongodb';
import Newsletter from '@/lib/db/models/Newsletter';

export default function NewsletterConfirmPage({ searchParams }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const confirmSubscription = async () => {
      await connectDB();
      const subscription = await Newsletter.findOne({ verificationToken: searchParams.token });
      if (!subscription) {
        setError('Invalid or expired token');
        return;
      }

      subscription.isSubscribed = true;
      subscription.verificationToken = null;
      await subscription.save();

      setMessage('Subscription confirmed successfully');
    };

    if (searchParams.token) {
      confirmSubscription();
    }
  }, [searchParams.token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Newsletter Subscription</h1>
        {message && <p className="text-center text-green-600">{message}</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        <p className="mt-4 text-center text-sm">
          <a href="/" className="text-primary hover:underline">Back to Home</a>
        </p>
      </div>
    </div>
  );
}