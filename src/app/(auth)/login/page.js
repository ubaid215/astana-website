"use client";

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    await signIn('credentials', { email, password, callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <Input id="email" type="email" required className="w-full" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <Input id="password" type="password" required className="w-full" />
          </div>
          <Button type="submit" className="w-full bg-primary text-white">Login</Button>
        </form>
        <div className="mt-4 space-y-2">
          <Button onClick={() => signIn('google')} className="w-full bg-red-600 text-white">Login with Google</Button>
          <Button onClick={() => signIn('facebook')} className="w-full bg-blue-600 text-white">Login with Facebook</Button>
        </div>
        <p className="mt-4 text-center text-sm">
          <a href="/forgot-password" className="text-primary hover:underline">Forgot Password?</a>
        </p>
        <p className="mt-2 text-center text-sm">
          Don&apos;t have an account? <a href="/register" className="text-primary hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}