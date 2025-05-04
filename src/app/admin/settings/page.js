import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { sendVerificationEmail } from '@/lib/mailtrap';
import crypto from 'crypto';

export default function SettingsPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = async (e) => {
    e.preventDefault();
    const newEmail = e.target.email.value;

    try {
      await connectDB();
      const session = await getSession();
      const user = await User.findById(session.user.id);
      if (!user) {
        setError('User not found');
        return;
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.email = newEmail;
      user.isVerified = false;
      user.verificationToken = verificationToken;
      await user.save();

      await sendVerificationEmail(newEmail, verificationToken);
      setMessage('Email updated. Please verify your new email.');
      setError('');
    } catch (err) {
      setError('Server error');
      setMessage('');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const newPassword = e.target.password.value;

    try {
      await connectDB();
      const session = await getSession();
      const user = await User.findById(session.user.id);
      if (!user) {
        setError('User not found');
        return;
      }

      user.password = newPassword;
      await user.save();

      setMessage('Password updated successfully');
      setError('');
    } catch (err) {
      setError('Server error');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        <h2 className="text-lg font-semibold mb-4">Change Email</h2>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">New Email</label>
            <Input id="email" type="email" required className="w-full" />
          </div>
          <Button type="submit" className="w-full bg-primary text-white">Update Email</Button>
        </form>
        <h2 className="text-lg font-semibold mt-6 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">New Password</label>
            <Input id="password" type="password" required className="w-full" />
          </div>
          <Button type="submit" className="w-full bg-primary text-white">Update Password</Button>
        </form>
        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    </div>
  );
}