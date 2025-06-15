import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[API] Unauthorized access attempt in delete-participant');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participationId, index } = await req.json();
    console.log('[API] Deleting participant:', { participationId, index });

    // Validate input
    if (!participationId || !participationId.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn('[API] Invalid participation ID:', participationId);
      return NextResponse.json({ error: 'Invalid participation ID' }, { status: 400 });
    }
    if (typeof index !== 'number' || index < 0) {
      console.warn('[API] Invalid index:', index);
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }

    await connectDB();

    // Find and update the Participation document
    const participation = await Participation.findById(participationId);
    if (!participation) {
      console.warn('[API] Participation not found for ID:', participationId);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    if (!Array.isArray(participation.members) || index >= participation.members.length) {
      console.warn('[API] Invalid participant index:', { index, membersLength: participation.members.length });
      return NextResponse.json({ error: 'Invalid participant index' }, { status: 400 });
    }

    // Remove the participant name at the specified index
    participation.members.splice(index, 1);
    await participation.save();
    console.log('[API] Participation updated after deletion:', participation._id);

    // Update the corresponding Slot document
    let slotUpdated = false;
    const slot = await Slot.findById(participation.slotId);
    if (slot) {
      const participantIndex = slot.participants.findIndex(
        p => p.participationId.toString() === participationId
      );
      if (participantIndex !== -1) {
        slot.participants[participantIndex].participantNames.splice(index, 1);
        if (slot.participants[participantIndex].participantNames.length === 0) {
          // If no participant names remain, remove the participant entry
          slot.participants.splice(participantIndex, 1);
          if (slot.participants.length === 0) {
            // If no participants remain, delete the slot
            await Slot.findByIdAndDelete(participation.slotId);
            console.log('[API] Deleted empty slot:', participation.slotId);
            const io = getIO();
            if (io) {
              io.to('admin').emit('slotDeleted', { slotId: participation.slotId.toString() });
              console.log('[API] Emitted slotDeleted event:', participation.slotId);
            }
          } else {
            await slot.save();
            slotUpdated = true;
          }
        } else {
          await slot.save();
          slotUpdated = true;
        }
      }
    }

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to('admin').emit('participantDeleted', {
        slotId: participation.slotId?.toString(),
        participationId: participationId.toString(),
        index,
      });
      console.log('[API] Emitted participantDeleted event:', {
        slotId: participation.slotId?.toString(),
        participationId: participationId.toString(),
        index,
      });
      if (slot && slotUpdated) {
        io.to('admin').emit('slotUpdated', slot);
        console.log('[API] Emitted slotUpdated event:', slot._id);
      }
    } else {
      console.warn('[API] Socket.IO instance not available');
    }

    return NextResponse.json({ message: 'Participant deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Error deleting participant:', {
      message: error.message,
      stack: error.stack,
      participationId: (await req.json())?.participationId,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}