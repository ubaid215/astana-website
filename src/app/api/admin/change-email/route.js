import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    console.log('[API] Received POST request to /api/admin/change-email');

    // Check session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      console.log('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { currentPassword, newEmail } = await req.json();

    // Validate input
    if (!currentPassword || !newEmail) {
      console.log('[API] Missing required fields');
      return NextResponse.json({ error: 'Current password and new email are required' }, { status: 400 });
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(newEmail)) {
      console.log('[API] Invalid email format:', newEmail);
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
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

    // Check if new email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      console.log('[API] Email already in use:', newEmail);
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    user.pendingEmail = newEmail;
    await user.save();

    // Send verification email
    await sendVerificationEmail(newEmail, verificationToken);
    console.log('[API] Verification email sent to:', newEmail);

    return NextResponse.json(
      { message: 'Verification email sent to new email address' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Change email error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}