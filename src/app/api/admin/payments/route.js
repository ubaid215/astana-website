export const dynamic = 'force-dynamic';

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIO } from '@/lib/socket';
import mongoose from 'mongoose';
import { allocateSlot } from '@/lib/slotAllocation';
import ParticipationSchema from '@/lib/db/models/Participation';

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

    // Safeguard: Reload Slot model to ensure it uses the latest schema without country
    if (mongoose.models.Slot) {
      const slotSchemaFields = Object.keys(mongoose.model('Slot').schema.paths);
      console.log('[Admin Payments API] Slot schema fields:', slotSchemaFields);
      if (slotSchemaFields.includes('country')) {
        console.warn('[Admin Payments API] Slot schema still includes country. Reloading Slot model...');
        delete mongoose.models.Slot;
        delete mongoose.modelSchemas.Slot;
        await import('@/lib/db/models/Slot'); // Re-import to register new model
        console.log('[Admin Payments API] Reloaded Slot schema fields:', Object.keys(mongoose.model('Slot').schema.paths));
      }
    }

    const schemaEnum = mongoose.model('Participation').schema.paths.paymentStatus.options.enum;
    console.log('[Admin Payments API] paymentStatus enum values:', schemaEnum);

    if (!schemaEnum.includes('Rejected')) {
      console.warn('[Admin Payments API] Schema mismatch detected. Reloading Participation model...');
      delete mongoose.models.Participation;
      mongoose.model('Participation', ParticipationSchema);
      console.log('[Admin Payments API] Reloaded schema enum:', mongoose.model('Participation').schema.paths.paymentStatus.options.enum);
    }

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

    console.log('[Admin Payments API] Before update:', { _id: participation._id, paymentStatus: participation.paymentStatus, slotId: participation.slotId });

    participation.paymentStatus = status;
    participation.paymentDate = new Date();

    let slots = [];
    let deletedSlotIds = [];

    if (status === 'Completed') {
      try {
        slots = await allocateSlot(participation);
        console.log('[Admin Payments API] Slot allocation result:', {
          participationId,
          slots: slots.map(s => s._id),
        });
        if (slots.length > 0) {
          participation.slotId = slots[0]._id;
          participation.timeSlot = slots[0].timeSlot;
          participation.slotAssigned = true;
        }
      } catch (slotError) {
        console.error('[Admin Payments API] Slot allocation failed:', {
          participationId,
          error: slotError.message,
        });
        throw slotError; // Re-throw to ensure error is propagated
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
          });
        }
      }
      participation.slotId = null;
      participation.timeSlot = null;
      participation.slotAssigned = false;
    }

    await participation.save();
    console.log('[Admin Payments API] After update:', { _id: participation._id, paymentStatus: participation.paymentStatus, slotId: participation.slotId });

    const io = getIO();
    if (io) {
      io.to('public').emit('paymentUpdate', participation);
      console.log('[Admin Payments API] Socket.io paymentUpdate emitted:', { participationId });

      if (slots.length > 0) {
        slots.forEach(slot => {
          io.to('admin').emit('slotCreated', slot);
          console.log('[Admin Payments API] Socket.io slotCreated emitted:', { slotId: slot._id });
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

    return NextResponse.json({ message: 'Payment status updated', slots: slots.map(s => s._id), deletedSlotIds }, { status: 200 });
  } catch (error) {
    console.error('[Admin Payments API] Update payment status error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}