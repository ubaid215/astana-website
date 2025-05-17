export const dynamic = 'force-dynamic';

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIO } from '@/lib/socket';
import mongoose from 'mongoose';
import { allocateSlot } from '@/lib/slotAllocation';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Admin Payments API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const participations = await Participation.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    return NextResponse.json(participations, { status: 200 });
  } catch (error) {
    console.error('[Admin Payments API] Fetch payments error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Admin Payments API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Log connection and schema state
    console.log('[Admin Payments API] MongoDB connection state:', mongoose.connection.readyState);
    console.log('[Admin Payments API] Slot schema paths:', Object.keys(Slot.schema.paths));
    console.log('[Admin Payments API] Slot timeSlot config:', JSON.stringify(Slot.schema.paths.timeSlot.options, null, 2));

    const { participationId, status } = await req.json();
    console.log('[Admin Payments API] Received PATCH request:', { participationId, status });

    if (!participationId || !['Pending', 'Completed', 'Rejected'].includes(status)) {
      console.error('[Admin Payments API] Invalid input:', { participationId, status });
      return NextResponse.json({ error: 'Invalid participation ID or status' }, { status: 400 });
    }

    const participation = await Participation.findById(participationId);
    if (!participation) {
      console.error('[Admin Payments API] Participation not found:', participationId);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Validate participation data
    if (status === 'Completed') {
      if (!participation.shares || participation.shares <= 0) {
        console.error('[Admin Payments API] Invalid shares:', { participationId, shares: participation.shares });
        return NextResponse.json({ error: 'Invalid number of shares' }, { status: 400 });
      }
      if (!participation.day || ![1, 2].includes(participation.day)) {
        console.error('[Admin Payments API] Invalid day:', { participationId, day: participation.day });
        return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
      }
      if (!participation.cowQuality || !['Standard', 'Medium', 'Premium'].includes(participation.cowQuality)) {
        console.error('[Admin Payments API] Invalid cowQuality:', { participationId, cowQuality: participation.cowQuality });
        return NextResponse.json({ error: 'Invalid cow quality' }, { status: 400 });
      }
    }

    console.log('[Admin Payments API] Before update:', {
      _id: participation._id,
      paymentStatus: participation.paymentStatus,
      slotId: participation.slotId,
      shares: participation.shares,
      day: participation.day,
      cowQuality: participation.cowQuality,
      timeSlot: participation.timeSlot,
    });

    participation.paymentStatus = status;
    participation.paymentDate = new Date();

    let slots = [];
    let deletedSlotIds = [];

    if (status === 'Completed') {
      try {
        slots = await allocateSlot(participation);
        console.log('[Admin Payments API] Slot allocation result:', {
          participationId,
          slots: slots.map(s => ({ _id: s._id, timeSlot: s.timeSlot, shares: s.participants.reduce((sum, p) => sum + p.shares, 0) })),
        });
        if (slots.length > 0) {
          participation.slotId = slots[0]._id;
          participation.timeSlot = slots[0].timeSlot;
          participation.slotAssigned = true;
        } else {
          console.warn('[Admin Payments API] No slots allocated:', { participationId });
          return NextResponse.json({ error: 'No slots available for allocation' }, { status: 500 });
        }
      } catch (slotError) {
        console.error('[Admin Payments API] Slot allocation failed:', {
          participationId,
          error: slotError.message,
          stack: slotError.stack,
        });
        return NextResponse.json({ error: `Slot allocation failed: ${slotError.message}` }, { status: 500 });
      }
    } else if (status === 'Rejected' || status === 'Pending') {
      if (participation.slotId) {
        try {
          const slotsToDelete = await Slot.find({
            'participants.participationId': participationId,
          });
          deletedSlotIds = slotsToDelete.map(slot => slot._id);
          await Slot.deleteMany({ 'participants.participationId': participationId });
          console.log('[Admin Payments API] Deleted slots:', { participationId, deletedSlotIds });
        } catch (deleteError) {
          console.error('[Admin Payments API] Slot deletion failed:', {
            participationId,
            error: deleteError.message,
            stack: deleteError.stack,
          });
        }
      }
      participation.slotId = null;
      participation.timeSlot = null;
      participation.slotAssigned = false;
    }

    await participation.save();
    console.log('[Admin Payments API] After update:', {
      _id: participation._id,
      paymentStatus: participation.paymentStatus,
      slotId: participation.slotId,
      timeSlot: participation.timeSlot,
      slotAssigned: participation.slotAssigned,
    });

    const io = getIO();
    if (io) {
      io.to('public').emit('paymentUpdate', participation);
      console.log('[Admin Payments API] Socket.io paymentUpdate emitted:', { participationId });

      if (slots.length > 0) {
        slots.forEach(slot => {
          io.to('admin').emit('slotCreated', slot);
          console.log('[Admin Payments API] Socket.io slotCreated emitted:', { slotId: slot._id, timeSlot: slot.timeSlot });
        });
      }

      if (deletedSlotIds.length > 0) {
        deletedSlotIds.forEach(slotId => {
          io.to('admin').emit('slotDeleted', { slotId });
          console.log('[Admin Payments API] Socket.io slotDeleted emitted:', { slotId });
        });
      }
    } else {
      console.warn('[Admin Payments API] Socket.io not initialized, skipping events');
    }

    return NextResponse.json({
      message: 'Payment status updated',
      slots: slots.map(s => ({ _id: s._id, timeSlot: s.timeSlot })),
      deletedSlotIds,
      timeSlot: participation.timeSlot,
      slotAssigned: participation.slotAssigned,
    }, { status: 200 });
  } catch (error) {
    console.error('[Admin Payments API] Update payment status error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// Global error handler to ensure JSON responses
process.on('uncaughtException', (error) => {
  console.error('[Admin Payments API] Uncaught exception:', {
    message: error.message,
    stack: error.stack,
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Admin Payments API] Unhandled promise rejection:', {
    reason: reason.message || reason,
    stack: reason.stack,
    promise,
  });
});