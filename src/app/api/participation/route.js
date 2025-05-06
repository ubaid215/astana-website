export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { getIO } from '@/lib/socket';
import { allocateSlot } from '@/lib/slotAllocation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req) {
  try {
    // Verify authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    // Validate input
    if (
      !data.collectorName ||
      !data.cowQuality ||
      !data.day ||
      !data.shares ||
      isNaN(data.shares) ||
      data.shares < 1 ||
      data.shares > 7
    ) {
      return NextResponse.json({ error: 'Invalid participation data' }, { status: 400 });
    }

    // Validate time slot availability
    if (data.timeSlot) {
      const existing = await Participation.find({
        timeSlot: data.timeSlot,
        day: data.day,
        cowQuality: data.cowQuality,
        slotAssigned: true,
      });
      const totalShares = existing.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + data.shares > 7) {
        return NextResponse.json({ error: 'Selected time slot is full' }, { status: 400 });
      }
    }

    // Create participation
    const participation = new Participation({
      ...data,
      userId: token.sub,
      paymentStatus: 'Pending',
      slotAssigned: false,
      createdAt: new Date(),
    });
    await participation.save();

    // Allocate slot
    const slot = await allocateSlot(participation);

    // Emit Socket.io events
    const io = getIO();
    if (io) {
      io.to('admin').emit('newParticipation', participation);
      if (slot) {
        io.to('admin').emit('updateSlot', slot);
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