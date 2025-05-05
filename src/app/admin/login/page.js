'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call admin login API
      const apiUrl = '/api/auth/admin-login';
      console.log('[Client] Fetching admin login API:', apiUrl, { email });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('[Client] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()]),
        url: response.url
      });

      // Get response text
      const responseText = await response.text();
      console.log('[Client] Response body preview:', responseText.substring(0, 200), 'Length:', responseText.length);

      // Check for HTML response
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('[Client] Received HTML instead of JSON:', responseText.substring(0, 500));
        throw new Error('Server error: Received HTML instead of JSON. Check server logs.');
      }

      // Parse JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('[Client] Failed to parse response as JSON:', parseError, { responseText });
        throw new Error('Invalid server response format');
      }

      if (!response.ok) {
        console.error('[Client] Admin login API error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data?.error || `Server error: ${response.status} ${response.statusText}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Sign in with NextAuth
      console.log('[Client] Signing in with NextAuth...');
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        isAdmin: 'true',
        callbackUrl
      });

      if (result?.error) {
        console.error('[Client] NextAuth signIn error:', result.error);
        if (result.error === 'CredentialsSignin') {
          throw new Error('Invalid email or password');
        } else if (result.error.includes('Admin access denied')) {
          throw new Error('You are not authorized as admin');
        } else {
          throw new Error(result.error);
        }
      }

      console.log('[Client] Redirecting to:', callbackUrl);
      router.push(callbackUrl);
    } catch (err) {
      setError(err.message);
      console.error('[Client] Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Portal</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Admin Email</Label>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
      </div>
    </div>
  );
}