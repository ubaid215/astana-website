export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('[API] Received POST request to /api/admin/change-password');

    // Check session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      console.log('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Current password, new password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      console.log('[API] Passwords do not match');
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      console.log('[API] Password too short');
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find admin user
    const user = await User.findOne({ email: session.user.email }).select('+password');
    if (!user || !user.isAdmin) {
      console.log('[API] Admin user not found:', session.user.email);
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      console.log('[API] Invalid current password for:', session.user.email);
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('[API] Password updated successfully for:', session.user.email);
    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Change password error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}