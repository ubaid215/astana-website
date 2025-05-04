import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function validateAdminCredentials(email, password) {
  if (!email || !password) {
    return { error: 'Email and password are required', status: 400 };
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return { error: 'No user found with this email', status: 401 };
  }

  console.log('Validating admin:', user.email);
  
  try {
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return { error: 'Invalid password', status: 401 };
    }

    if (!user.isVerified) {
      return { error: 'Please verify your email first', status: 401 };
    }

    if (!user.isAdmin) {
      return { error: 'Not authorized to access admin area', status: 403 };
    }

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: true
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
    if (existingSession?.user?.isAdmin) {
      return Response.json({ 
        success: true, 
        message: 'Already authenticated',
        user: existingSession.user
      }, { status: 200 });
    }

    const result = await validateAdminCredentials(email, password);
    
    if (result.error) {
      return Response.json({ error: result.error }, { 
        status: result.status || 401 
      });
    }

    return Response.json({ 
      success: true, 
      user: result.user
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}