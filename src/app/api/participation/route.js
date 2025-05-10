import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { allocateSlot } from '@/lib/slotAllocation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('[API] Token:', token);
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();
    console.log('[API] Participation data:', data);

    if (
      !data.collectorName ||
      !data.cowQuality ||
      !data.day ||
      !data.shares ||
      isNaN(data.shares) ||
      data.shares < 1
    ) {
      console.log('[API] Invalid participation data:', data);
      return NextResponse.json({ error: 'Invalid participation data' }, { status: 400 });
    }

    if (data.shares > 7) {
      data.timeSlot = '';
      console.log('[API] Shares > 7, clearing timeSlot');
    }

    if (data.timeSlot && data.shares <= 7) {
      const existing = await Participation.find({
        timeSlot: data.timeSlot,
        day: data.day,
        cowQuality: data.cowQuality,
        slotAssigned: true,
      });
      const totalShares = existing.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + data.shares > 7) {
        console.log('[API] Time slot full:', { timeSlot: data.timeSlot, totalShares, newShares: data.shares });
        return NextResponse.json({ error: 'Selected time slot is full' }, { status: 400 });
      }
    }

    const participation = new Participation({
      ...data,
      userId: token.sub,
      paymentStatus: 'Pending',
      slotAssigned: false,
      createdAt: new Date(),
    });
    await participation.save();
    console.log('[API] New participation saved:', participation._id);

    const slots = await allocateSlot(participation);
    console.log('[API] Slots allocated:', slots);

    const io = getIO();
    if (io) {
      console.log('[API] Emitting newParticipation event:', participation._id);
      io.to('admin').emit('newParticipation', participation);
      if (slots) {
        slots.forEach((slot) => {
          console.log('[API] Emitting updateSlot event:', slot._id);
          io.to('admin').emit('updateSlot', slot);
        });
      }
    } else {
      console.warn('[API] Socket.io not available, skipping events');
    }

    return NextResponse.json({ participationId: participation._id }, { status: 201 });
  } catch (error) {
    console.error('[API] Participation error:', {
      message: error.message,
      stack: error.stack,
      data: await req.json().catch(() => 'Invalid JSON'),
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}