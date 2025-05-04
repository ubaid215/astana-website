import { useEffect, useState } from 'react';

export default function VerifyEmailPage({ searchParams }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const res = await fetch(`/api/auth/verify-email?token=${searchParams.token}`);
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError('');
      } else {
        setError(data.error);
        setMessage('');
      }
    };
    if (searchParams.token) {
      verifyEmail();
    }
  }, [searchParams.token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Verify Email</h1>
        {message && <p className="text-center text-green-600">{message}</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        <p className="mt-4 text-center text-sm">
          <a href="/login" className="text-primary hover:underline">Back to Login</a>
        </p>
      </div>
    </div>
  );
}