export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
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
      isVerified: true,
    });

    await user.save();

    return NextResponse.json(
      { 
        message: 'Registration successful. You can now login.',
        verificationToken: verificationToken // Returning token for manual verification if needed
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}