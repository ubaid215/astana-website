import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { emitSocketEvent } from '@/lib/emitSocketEvent';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function DELETE(req, context) {
  try {
    // 1. Extract parameters and check authorization
    const { id } = await context.params; // Await params to resolve dynamic route
    console.log('[API] DELETE /api/participation/[id] called with id:', id);
    
    // Await the token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Connect to database and find participation
    await connectDB();
    
    const participation = await Participation.findById(id);
    if (!participation) {
      console.warn('[API] Participation not found for id:', id);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // 3. Remove from slot if assigned
    if (participation.slotId) {
      await Slot.updateOne(
        { _id: participation.slotId },
        { $pull: { participants: { participationId: id } } }
      );

      // 3a. Emit slot updated event
      try {
        const updatedSlot = await Slot.findById(participation.slotId);
        if (updatedSlot) {
          const emitted = emitSocketEvent('slotUpdated', updatedSlot);
          console.log('[API] slotUpdated event emission:', emitted ? 'Success' : 'Failed');
        }
      } catch (slotError) {
        console.warn('[API] Failed to emit slotUpdated:', slotError.message);
      }
    }

    // 4. Delete the participation
    await Participation.deleteOne({ _id: id });

    // 5. Emit deletion event
    const emitted = emitSocketEvent('participationDeleted', id, ['admin', 'public']);
    
    if (emitted) {
      console.log('[API] Successfully emitted participationDeleted for:', id);
    } else {
      // Fallback to direct socket.io usage
      try {
        const io = getIO();
        if (io) {
          io.to('admin').emit('participationDeleted', id);
          console.log('[API] Emitted participationDeleted via direct call for:', id);
        } else {
          console.warn('[API] Socket.io not initialized, skipping participationDeleted emission');
        }
      } catch (socketError) {
        console.warn('[API] Socket.io emission error:', socketError.message);
      }
    }

    // 6. Return success response
    return NextResponse.json(
      { message: 'Participation deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] DELETE Participation Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}