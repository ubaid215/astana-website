import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
      name,
      email,
      password,
      verificationToken,
      isVerified: false,
    });

    await user.save();

    try {
      await sendVerificationEmail(email, verificationToken);
      return NextResponse.json(
        { message: 'Registration successful. Please check your email to verify your account.' },
        { status: 201 }
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        {
          message: 'Registration successful, but we couldn\'t send the verification email. Please contact support.',
          needsManualVerification: true,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}