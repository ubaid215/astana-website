import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import ShareLimit from '@/lib/db/models/ShareLimit';
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
      console.log('[API] Invalid participation data:', data);
      return NextResponse.json({ error: 'Invalid participation data' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const shareLimit = await ShareLimit.findOne().session(session);
      if (!shareLimit) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Share limits not configured' }, { status: 500 });
      }

      const cowQualityLower = data.cowQuality.toLowerCase();
      const maxShares = shareLimit[cowQualityLower] ?? 7;
      const remainingShares = shareLimit.remainingShares[cowQualityLower] ?? maxShares;

      if (remainingShares === 0) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: `This cow quality (${data.cowQuality}) has closed, choose another one` },
          { status: 400 }
        );
      }
      if (data.shares > remainingShares) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: `Only ${remainingShares} shares remaining for ${data.cowQuality} quality` },
          { status: 400 }
        );
      }

      // Update participatedShares and remainingShares
      shareLimit.participatedShares[cowQualityLower] = (shareLimit.participatedShares[cowQualityLower] || 0) + data.shares;
      shareLimit.remainingShares[cowQualityLower] = maxShares - shareLimit.participatedShares[cowQualityLower];
      shareLimit.updatedAt = new Date();
      await shareLimit.save({ session });

      const shareLimitData = {
        standard: shareLimit.standard,
        medium: shareLimit.medium,
        premium: shareLimit.premium,
        participatedShares: shareLimit.participatedShares,
        remainingShares: shareLimit.remainingShares,
      };

      const participation = new Participation({
        ...data,
        userId: token.sub,
        paymentStatus: 'Pending',
        slotAssigned: false,
        createdAt: new Date(),
      });
      await participation.save({ session });

      console.log('[API] New participation saved:', participation._id);

      const slots = await allocateSlot(participation, session);
      console.log('[API] Slots allocated:', slots);

      await session.commitTransaction();

      const io = getIO();
      if (io) {
        console.log('[API] Broadcasting share limit update via Socket.IO:', shareLimitData);
        io.to('public').emit('shareLimitsUpdated', shareLimitData);
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
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('[API] Participation error:', {
      message: error.message,
      stack: error.stack,
      data: await req.json().catch(() => 'Invalid JSON'),
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}