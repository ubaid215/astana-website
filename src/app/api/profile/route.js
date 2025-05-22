import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch participations for the user
    const participations = await Participation.find({ userId: token.id }).lean();

    // Populate the completed field by looking up the associated Slot
    for (let participation of participations) {
      if (participation.slotId) {
        const slot = await Slot.findById(participation.slotId).select('completed').lean();
        participation.slotAssigned = !!participation.slotId;
        participation.completed = slot ? slot.completed : false;
      } else {
        participation.slotAssigned = false;
        participation.completed = false;
      }
    }

    console.log('[Profile] Fetched participations for user:', token.id, participations);

    return NextResponse.json(participations, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}