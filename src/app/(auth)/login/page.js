'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call user login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'User authentication failed');
      }

      // Sign in with NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        isAdmin: 'false',
        callbackUrl
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          throw new Error('Invalid email or password');
        } else if (result.error.includes('Admin access denied')) {
          throw new Error('Use the admin login page for admin accounts');
        } else {
          throw new Error(result.error);
        }
      }

      router.push(callbackUrl);
    } catch (err) {
      setError(err.message);
      console.error('User login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">User Login</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Authenticating...
              </span>
            ) : 'Login'}
          </Button>
        </form>
        <div className="mt-4 space-y-2">
          <Button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full bg-red-600 text-white"
          >
            Login with Google
          </Button>
          <Button
            onClick={() => signIn('facebook', { callbackUrl })}
            className="w-full bg-blue-600 text-white"
          >
            Login with Facebook
          </Button>
        </div>
        <p className="mt-4 text-center text-sm">
          <a href="/forgot-password" className="text-primary hover:underline">
            Forgot Password?
          </a>
        </p>
        <p className="mt-2 text-center text-sm">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-primary hover:underline">
            Register
          </a>
        </p>
        <p className="mt-2 text-center text-sm">
          Admin?{' '}
          <a href="/admin/login" className="text-primary hover:underline">
            Login as Admin
          </a>
        </p>
      </div>
    </div>
  );
}