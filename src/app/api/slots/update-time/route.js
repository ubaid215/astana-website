import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function PATCH(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { slotId, timeSlot } = await req.json();
    console.log('[API] Update time slot request:', { slotId, timeSlot });

    if (!slotId || !timeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check if the new time slot is already taken for the same day
    const existingSlot = await Slot.findOne({
      day: slot.day,
      timeSlot,
      _id: { $ne: slotId },
    });

    if (existingSlot) {
      return NextResponse.json({ error: 'Time slot is already taken' }, { status: 400 });
    }

    slot.timeSlot = timeSlot;
    await slot.save();

    const io = getIO();
    if (io) {
      io.to('admin').emit('slotUpdated', slot);
    }

    return NextResponse.json(slot, { status: 200 });
  } catch (error) {
    console.error('[API] Update time slot error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}