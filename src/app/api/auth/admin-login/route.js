// app/api/auth/admin-login/route.js
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

// Helper function to validate admin credentials and return user if valid
export async function validateAdminCredentials(email, password) {
  if (!email || !password) {
    return { error: 'Email and password are required', status: 400 };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { error: 'No user found with this email', status: 401 };
  }

  if (!user.isVerified) {
    return { error: 'Please verify your email first', status: 401 };
  }

  if (!user.isAdmin) {
    return { error: 'Not authorized to access admin area', status: 403 };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { error: 'Invalid password', status: 401 };
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: true
    }
  };
}

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    // Check if already authenticated as admin
    const existingSession = await getServerSession(authOptions);
    if (existingSession?.user?.isAdmin) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Already authenticated',
        user: existingSession.user
      }), { status: 200 });
    }

    // Validate credentials
    const result = await validateAdminCredentials(email, password);
    
    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), { 
        status: result.status || 401 
      });
    }

    // Return successful response with user data
    // The frontend will handle the signin process
    return new Response(JSON.stringify({ 
      success: true, 
      user: result.user
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}