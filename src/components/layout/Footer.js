"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError('');
        setEmail('');
      } else {
        setError(data.error);
        setMessage('');
      }
    } catch (err) {
      setError('Server error');
      setMessage('');
    }
  };

  return (
    <footer className="bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Eid ul Adha Participation</h3>
          <p className="text-sm">Join our platform for a seamless Eid ul Adha experience.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:underline">Login</Link></li>
            <li><Link href="/register" className="hover:underline">Register</Link></li>
            <li><Link href="/forgot-password" className="hover:underline">Forgot Password</Link></li>
            <li><Link href="/admin" className="hover:underline">Admin Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-white text-gray-900"
            />
            <Button type="submit" className="w-full bg-secondary text-white">Subscribe</Button>
          </form>
          {message && <p className="mt-2 text-sm text-green-300">{message}</p>}
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        </div>
      </div>
      <div className="mt-6 text-center text-sm">
        &copy; {new Date().getFullYear()} Eid ul Adha Participation System. All rights reserved.
      </div>
    </footer>
  );
}