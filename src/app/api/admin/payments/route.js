import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { allocateSlot } from '@/lib/slotAllocation';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      console.error('[Admin Payments API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add admin role check
    if (!token.isAdmin) {
      console.error('[Admin Payments API] Forbidden: User is not admin', { userId: token.sub });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    console.log('[Admin Payments API] MongoDB connected');

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    const query = filter === 'all' ? {} : { paymentStatus: filter };

    const participations = await Participation.find(query)
      .populate({
        path: 'userId',
        select: 'name email',
      })
      .populate({
        path: 'slotId',
        select: 'day timeSlot completed cowQuality',
      })
      .sort({ paymentDate: -1 });

    const formattedParticipations = participations.map((p) => p.toObject({ virtuals: true }));

    console.log('[Admin Payments API] Fetched participations:', formattedParticipations.length);

    return NextResponse.json(formattedParticipations, { status: 200 });
  } catch (error) {
    console.error('[Admin Payments API] GET Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      console.error('[Admin Payments API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add admin role check
    if (!token.isAdmin) {
      console.error('[Admin Payments API] Forbidden: User is not admin', { userId: token.sub });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    console.log('[Admin Payments API] MongoDB connected');

    const { participationId, status } = await req.json();

    if (!participationId || !['Pending', 'Completed', 'Rejected'].includes(status)) {
      console.error('[Admin Payments API] Invalid request data', { participationId, status });
      return NextResponse.json(
        { error: 'Invalid participationId or status' },
        { status: 400 }
      );
    }

    const participation = await Participation.findById(participationId);
    if (!participation) {
      console.error('[Admin Payments API] Participation not found', { participationId });
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    participation.paymentStatus = status;
    participation.paymentDate = status === 'Completed' ? new Date() : participation.paymentDate;
    participation.updatedAt = new Date();

    let slots = [];
    if (status === 'Completed' && !participation.slotAssigned) {
      try {
        slots = await allocateSlot(participation);
        if (slots.length === 0) {
          console.warn('[Admin Payments API] No slots allocated', { participationId });
        } else {
          console.log('[Admin Payments API] Slots allocated', {
            participationId,
            slotIds: slots.map((s) => s._id),
            timeSlot: participation.timeSlot,
          });
        }
      } catch (allocationError) {
        console.error('[Admin Payments API] Slot allocation failed', {
          participationId,
          error: allocationError.message,
        });
        return NextResponse.json(
          { error: `Failed to allocate slot: ${allocationError.message}` },
          { status: 500 }
        );
      }
    }

    await participation.save();
    console.log('[Admin Payments API] Participation updated', {
      participationId,
      paymentStatus: status,
      slotAssigned: participation.slotAssigned,
      slotId: participation.slotId,
    });

    return NextResponse.json(
      {
        message: 'Payment status updated successfully',
        slots: slots.map((s) => s.toObject()),
        timeSlot: participation.timeSlot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Payments API] PATCH Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}