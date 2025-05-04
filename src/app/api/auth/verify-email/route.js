import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400 });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return new Response(JSON.stringify({ message: 'Email verified successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}