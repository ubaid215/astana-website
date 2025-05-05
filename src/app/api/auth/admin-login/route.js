import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function validateAdminCredentials(email, password) {
  console.log('[API] Validating admin credentials:', { email });

  if (!email || !password) {
    console.log('[API] Validation failed: Missing email or password');
    return { error: 'Email and password are required', status: 400 };
  }

  try {
    console.log('[API] Querying user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('[API] Validation failed: No user found with email:', email);
      return { error: 'No user found with this email', status: 401 };
    }

    console.log('[API] Found user:', { email: user.email, isAdmin: user.isAdmin, isVerified: user.isVerified });

    console.log('[API] Comparing password...');
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      console.log('[API] Validation failed: Invalid password for:', email);
      return { error: 'Invalid password', status: 401 };
    }

    if (!user.isVerified) {
      console.log('[API] Validation failed: User not verified:', email);
      return { error: 'Please verify your email first', status: 401 };
    }

    if (!user.isAdmin) {
      console.log('[API] Validation failed: User is not admin:', email);
      return { error: 'Not authorized to access admin area', status: 403 };
    }

    console.log('[API] Validation successful for admin:', email);
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isAdmin: true
      }
    };
  } catch (error) {
    console.error('[API] Validation error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export async function POST(req) {
  console.log('[API] Received POST request to /api/admin/login');

  try {
    console.log('[API] Connecting to database...');
    await connectDB();
    console.log('[API] Database connected');

    console.log('[API] Parsing request body...');
    const { email, password } = await req.json();
    console.log('[API] Parsed request body:', { email });

    console.log('[API] Checking for existing session...');
    const existingSession = await getServerSession(authOptions);
    if (existingSession?.user?.isAdmin) {
      console.log('[API] Existing admin session found:', existingSession.user.email);
      return Response.json(
        {
          success: true,
          message: 'Already authenticated',
          user: existingSession.user
        },
        { status: 200 }
      );
    }

    console.log('[API] Validating credentials...');
    const result = await validateAdminCredentials(email, password);

    if (result.error) {
      console.log('[API] Validation result:', result);
      return Response.json({ error: result.error }, { status: result.status || 401 });
    }

    console.log('[API] Returning successful response for:', email);
    return Response.json(
      {
        success: true,
        user: result.user
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[API] Admin login error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}