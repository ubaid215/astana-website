'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

export default function AdminSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  // State for site settings
  const [settings, setSettings] = useState({
    siteName: 'Eid ul Adha Participation',
    contactEmail: 'support@example.com',
    announcement: '',
  });

  // State for email change
  const [emailForm, setEmailForm] = useState({
    currentPassword: '',
    newEmail: '',
  });

  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState({
    settings: false,
    email: false,
    password: false,
  });
  const [error, setError] = useState({
    settings: '',
    email: '',
    password: '',
  });
  const [success, setSuccess] = useState({
    settings: '',
    email: '',
    password: '',
  });

  if (status === 'loading') {
    return <div className="min-h-screen bg-background p-6 text-center ml-0 md:ml-64">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/admin/login');
    return null;
  }

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, settings: true });
    setError({ ...error, settings: '' });
    setSuccess({ ...success, settings: '' });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess({ ...success, settings: 'Settings updated successfully' });
      } else {
        setError({ ...error, settings: data.error || 'Failed to update settings' });
      }
    } catch (err) {
      setError({ ...error, settings: 'Server error' });
    } finally {
      setLoading({ ...loading, settings: false });
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, email: true });
    setError({ ...error, email: '' });
    setSuccess({ ...success, email: '' });

    try {
      const res = await fetch('/api/admin/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess({ ...success, email: 'Verification email sent to your new email address' });
        setEmailForm({ currentPassword: '', newEmail: '' });
      } else {
        setError({ ...error, email: data.error || 'Failed to initiate email change' });
      }
    } catch (err) {
      setError({ ...error, email: 'Server error' });
    } finally {
      setLoading({ ...loading, email: false });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, password: true });
    setError({ ...error, password: '' });
    setSuccess({ ...success, password: '' });

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess({ ...success, password: 'Password updated successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError({ ...error, password: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setError({ ...error, password: 'Server error' });
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">Admin Settings</h1>

      {/* Site Settings Form */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
        {error.settings && <p className="text-red-600 mb-4">{error.settings}</p>}
        {success.settings && <p className="text-green-600 mb-4">{success.settings}</p>}
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="announcement">Site Announcement</Label>
            <Textarea
              id="announcement"
              value={settings.announcement}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading.settings} className="bg-primary text-white">
            {loading.settings ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>

      {/* Change Email Form */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mb-8">
        <h2 className="text-xl font-semibold mb-4">Change Email</h2>
        {error.email && <p className="text-red-600 mb-4">{error.email}</p>}
        {success.email && <p className="text-green-600 mb-4">{success.email}</p>}
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <Label htmlFor="currentPasswordEmail">Current Password</Label>
            <Input
              id="currentPasswordEmail"
              type="password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <Button type="submit" disabled={loading.email} className="bg-primary text-white">
            {loading.email ? 'Submitting...' : 'Change Email'}
          </Button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        {error.password && <p className="text-red-600 mb-4">{error.password}</p>}
        {success.password && <p className="text-green-600 mb-4">{success.password}</p>}
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <Label htmlFor="currentPasswordPass">Current Password</Label>
            <Input
              id="currentPasswordPass"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <Button type="submit" disabled={loading.password} className="bg-primary text-white">
            {loading.password ? 'Submitting...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}