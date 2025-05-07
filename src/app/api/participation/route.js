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
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    if (
      !data.collectorName ||
      !data.cowQuality ||
      !data.day ||
      !data.shares ||
      isNaN(data.shares) ||
      data.shares < 1
    ) {
      return NextResponse.json({ error: 'Invalid participation data' }, { status: 400 });
    }

    if (data.shares > 7) {
      data.timeSlot = '';
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

    const slots = await allocateSlot(participation);

    const io = getIO();
    if (io) {
      io.to('admin').emit('newParticipation', participation);
      if (slots) {
        slots.forEach((slot) => io.to('admin').emit('updateSlot', slot));
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

export async function DELETE(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Delete all participations
    const { searchParams } = new URL(req.url);
    if (!searchParams.get('id')) {
      await Participation.deleteMany({});
      await Slot.updateMany({}, { $set: { participants: [] } }); // Clear participants from slots

      const io = getIO();
      if (io) {
        io.to('admin').emit('allParticipationsDeleted');
      } else {
        console.warn('[API] Socket.io not available, skipping events');
      }

      return NextResponse.json({ message: 'All participations deleted' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('[API] Delete all participations error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}