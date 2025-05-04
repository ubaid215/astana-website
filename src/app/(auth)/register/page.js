"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMessage(data.message || 'Registration successful!');
      if (data.needsManualVerification) {
        setMessage(prev => prev + ' Please contact support for verification.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <Input id="name" name="name" type="text" required className="w-full" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" name="email" type="email" required className="w-full" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <Input id="password" name="password" type="password" required className="w-full" />
          </div>
          <Button type="submit" className="w-full bg-primary text-white">Register</Button>
        </form>
        
        {message && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/auth/login" className="text-primary hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}