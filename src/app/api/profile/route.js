import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import User from '@/lib/db/models/User';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    console.log('[Profile API] Received GET request at', new Date().toISOString());

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      console.warn('[Profile API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('[Profile API] MongoDB connected');

    let userId;
    try {
      userId = new mongoose.Types.ObjectId(token.sub);
    } catch (err) {
      console.error('[Profile API] Invalid user ID format:', token.sub);
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(userId)
      .select('qurbaniCompletions')
      .lean();

    if (!user) {
      console.error('[Profile API] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const participations = await Participation.find({ userId })
      .populate({
        path: 'slotId',
        select: 'day timeSlot completed cowQuality',
      })
      .sort({ createdAt: -1 });

    const formattedParticipations = participations.map((p) => {
      const plainParticipation = p.toObject({ virtuals: true });
      console.log('[Profile API] Participation paymentSubmissions:', plainParticipation.paymentSubmissions);
      return {
        ...plainParticipation,
        slotAssigned: !!p.slotId,
        completed: p.slotId?.completed || false,
        cowQuality: p.slotId?.cowQuality || p.cowQuality,
        paymentSubmissions: plainParticipation.paymentSubmissions || [],
      };
    });

    const sortedCompletions = user.qurbaniCompletions
      ? [...user.qurbaniCompletions].sort(
          (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
        )
      : [];

    // Calculate stats properly
    const totalPaymentSubmissions = formattedParticipations.reduce(
      (sum, p) => sum + (p.paymentSubmissions?.length || 0), 
      0
    );

    const stats = {
      participations: formattedParticipations.length,
      paymentSubmissions: totalPaymentSubmissions,
      completions: sortedCompletions.length,
    };

    console.log('[Profile API] Successfully fetched profile data:', stats);

    return NextResponse.json(
      {
        participations: formattedParticipations,
        qurbaniCompletions: sortedCompletions,
        stats: stats, // Add stats to response
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Profile API] Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}