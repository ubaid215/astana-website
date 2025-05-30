import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
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

// Helper function to deallocate slots when status changes from Completed to Pending
async function deallocateSlots(participation) {
  try {
    console.log('[deallocateSlots] Starting deallocation for participation:', participation._id);
    
    // Find all slots that contain this participation
    const slots = await Slot.find({
      'participants.participationId': participation._id
    });

    console.log('[deallocateSlots] Found slots to process:', slots.length);

    for (const slot of slots) {
      // Remove this participation from the slot
      const originalParticipantCount = slot.participants.length;
      slot.participants = slot.participants.filter(
        p => p.participationId.toString() !== participation._id.toString()
      );

      console.log('[deallocateSlots] Slot participants before/after:', {
        slotId: slot._id,
        timeSlot: slot.timeSlot,
        before: originalParticipantCount,
        after: slot.participants.length
      });

      // If no participants left, delete the slot
      if (slot.participants.length === 0) {
        await Slot.findByIdAndDelete(slot._id);
        console.log('[deallocateSlots] Deleted empty slot:', slot._id);
      } else {
        // Save the updated slot
        await slot.save();
        console.log('[deallocateSlots] Updated slot:', slot._id);
      }
    }

    // Clear slot assignment from participation
    participation.slotId = null;
    participation.timeSlot = null;
    participation.slotAssigned = false;
    
    console.log('[deallocateSlots] Deallocation completed for participation:', participation._id);
    return true;
  } catch (error) {
    console.error('[deallocateSlots] Error:', {
      participationId: participation._id,
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to deallocate slots: ${error.message}`);
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

    const previousStatus = participation.paymentStatus;
    console.log('[Admin Payments API] Status change:', {
      participationId,
      from: previousStatus,
      to: status
    });

    let slots = [];
    let statusChangeMessage = '';

    // Handle status change from Completed to Pending - deallocate slots
    if (previousStatus === 'Completed' && status === 'Pending') {
      try {
        await deallocateSlots(participation);
        statusChangeMessage = ' and slots deallocated';
        console.log('[Admin Payments API] Slots deallocated successfully', { participationId });
      } catch (deallocationError) {
        console.error('[Admin Payments API] Slot deallocation failed', {
          participationId,
          error: deallocationError.message,
        });
        return NextResponse.json(
          { error: `Failed to deallocate slots: ${deallocationError.message}` },
          { status: 500 }
        );
      }
    }

    // Update payment status and date
    participation.paymentStatus = status;
    participation.paymentDate = status === 'Completed' ? new Date() : participation.paymentDate;
    participation.updatedAt = new Date();

    // Handle status change from Pending/Rejected to Completed - allocate slots
    if ((previousStatus === 'Pending' || previousStatus === 'Rejected') && status === 'Completed') {
      try {
        slots = await allocateSlot(participation);
        if (slots.length === 0) {
          console.warn('[Admin Payments API] No slots allocated', { participationId });
          statusChangeMessage = ' but no slots were allocated (may be due to capacity constraints)';
        } else {
          statusChangeMessage = ' and slots allocated';
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

    // Handle status change from Completed to Rejected - deallocate slots
    if (previousStatus === 'Completed' && status === 'Rejected') {
      try {
        await deallocateSlots(participation);
        statusChangeMessage = ' and slots deallocated';
        console.log('[Admin Payments API] Slots deallocated for rejected payment', { participationId });
      } catch (deallocationError) {
        console.error('[Admin Payments API] Slot deallocation failed for rejection', {
          participationId,
          error: deallocationError.message,
        });
        return NextResponse.json(
          { error: `Failed to deallocate slots: ${deallocationError.message}` },
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
      timeSlot: participation.timeSlot,
    });

    return NextResponse.json(
      {
        message: `Payment status updated successfully${statusChangeMessage}`,
        slots: slots.map((s) => s.toObject()),
        timeSlot: participation.timeSlot,
        statusChange: {
          from: previousStatus,
          to: status,
          slotsAffected: previousStatus === 'Completed' || status === 'Completed'
        }
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