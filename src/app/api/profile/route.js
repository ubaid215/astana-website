import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import User from '@/lib/db/models/User';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    console.log('[Profile API] Received GET request at', new Date().toISOString());

    // Authenticate user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      console.warn('[Profile API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('[Profile API] MongoDB connected');

    // Validate and convert user ID
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(token.id);
    } catch (err) {
      console.error('[Profile API] Invalid user ID format:', token.id);
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Fetch user with completions
    const user = await User.findById(userId)
      .select('qurbaniCompletions')
      .lean();
    
    if (!user) {
      console.error('[Profile API] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch participations with populated slot data
    const participations = await Participation.find({ userId })
      .populate({
        path: 'slotId',
        select: 'day timeSlot completed cowQuality',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Format participations with additional status fields
    const formattedParticipations = participations.map(p => ({
      ...p,
      slotAssigned: !!p.slotId,
      completed: p.slotId?.completed || false,
      cowQuality: p.slotId?.cowQuality || p.cowQuality,
    }));

    // Sort completions by most recent first
    const sortedCompletions = user.qurbaniCompletions
      ? [...user.qurbaniCompletions].sort(
          (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
        )
      : [];

    console.log('[Profile API] Successfully fetched profile data:', {
      participations: formattedParticipations.length,
      completions: sortedCompletions.length
    });

    return NextResponse.json({
      participations: formattedParticipations,
      qurbaniCompletions: sortedCompletions,
    }, { status: 200 });

  } catch (error) {
    console.error('[Profile API] Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ 
      error: error.message || 'Server error' 
    }, { status: 500 });
  }
}