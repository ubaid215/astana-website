'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Eye, EyeOff } from 'lucide-react';

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

  // State for password visibility
  const [passwordVisibility, setPasswordVisibility] = useState({
    emailCurrentPassword: false,
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
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
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/admin/login');
    return null;
  }

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field],
    });
  };

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Site Settings Form */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Site Settings</h2>
          {error.settings && <p className="text-red-600 mb-3 text-sm">{error.settings}</p>}
          {success.settings && <p className="text-green-600 mb-3 text-sm">{success.settings}</p>}
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div>
              <Label htmlFor="siteName" className="text-sm">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail" className="text-sm">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="announcement" className="text-sm">Site Announcement</Label>
              <Textarea
                id="announcement"
                value={settings.announcement}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                className="mt-1 text-sm"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading.settings} className="bg-primary text-white text-sm w-full sm:w-auto">
              {loading.settings ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </div>

        {/* Change Email Form */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Change Email</h2>
          {error.email && <p className="text-red-600 mb-3 text-sm">{error.email}</p>}
          {success.email && <p className="text-green-600 mb-3 text-sm">{success.email}</p>}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPasswordEmail" className="text-sm">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="currentPasswordEmail"
                  type={passwordVisibility.emailCurrentPassword ? "text" : "password"}
                  value={emailForm.currentPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                  className="text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('emailCurrentPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {passwordVisibility.emailCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="newEmail" className="text-sm">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                className="mt-1 text-sm"
                required
              />
            </div>
            <Button type="submit" disabled={loading.email} className="bg-primary text-white text-sm w-full sm:w-auto">
              {loading.email ? 'Submitting...' : 'Change Email'}
            </Button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded shadow p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Change Password</h2>
          {error.password && <p className="text-red-600 mb-3 text-sm">{error.password}</p>}
          {success.password && <p className="text-green-600 mb-3 text-sm">{success.password}</p>}
          <form onSubmit={handlePasswordSubmit} className="space-y-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currentPasswordPass" className="text-sm">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="currentPasswordPass"
                  type={passwordVisibility.currentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('currentPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {passwordVisibility.currentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-sm">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={passwordVisibility.newPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {passwordVisibility.newPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={passwordVisibility.confirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {passwordVisibility.confirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={loading.password} className="bg-primary text-white text-sm w-full sm:w-auto">
                {loading.password ? 'Submitting...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}