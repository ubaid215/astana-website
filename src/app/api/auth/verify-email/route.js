export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 400 });
    }

    // Find user with matching verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Update user to mark email as verified
    if (user.pendingEmail) {
      user.email = user.pendingEmail;
      user.pendingEmail = null;
    }
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Verify email error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}