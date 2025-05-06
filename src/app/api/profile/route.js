export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const participations = await Participation.find({ userId: token.sub })
      .sort({ createdAt: -1 })
      .populate('slotId', 'timeSlot day cowQuality country');

    // Return participations in an object with a "participations" key
    return NextResponse.json({ participations }, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}