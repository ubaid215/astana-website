export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function validateUserCredentials(email, password) {
  if (!email || !password) {
    return { error: 'Email and password are required', status: 400 };
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return { error: 'Invalid email or password', status: 401 };
  }

  try {
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return { error: 'Invalid email or password', status: 401 };
    }

    // Removed email verification check
    if (user.isAdmin) {
      return { error: 'Admin accounts cannot use user login', status: 403 };
    }

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: false
      }
    };
  } catch (error) {
    console.error('Validation error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const existingSession = await getServerSession(authOptions);
    if (existingSession?.user && !existingSession.user.isAdmin) {
      return Response.json({
        success: true,
        message: 'Already authenticated',
        user: existingSession.user
      }, { status: 200 });
    }

    const result = await validateUserCredentials(email, password);

    if (result.error) {
      return Response.json({ error: result.error }, {
        status: result.status || 401
      });
    }

    return Response.json({
      success: true,
      user: result.user
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}