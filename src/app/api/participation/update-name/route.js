import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function PATCH(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participationId, index, newName } = await req.json();

    // Validate input
    if (!participationId || !participationId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('[API] Invalid participation ID:', participationId);
      return NextResponse.json({ error: 'Invalid participation ID' }, { status: 400 });
    }
    if (typeof index !== 'number' || index < 0) {
      console.log('[API] Invalid index:', index);
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }
    if (typeof newName !== 'string' || newName.trim() === '') {
      console.log('[API] Invalid newName:', newName);
      return NextResponse.json({ error: 'Participant name cannot be empty' }, { status: 400 });
    }

    await connectDB();

    // Update the Participation document
    const participation = await Participation.findById(participationId);
    if (!participation) {
      console.log('[API] Participation not found for ID:', participationId);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    console.log('[API] Participation document:', participation);

    // Check if members is an array
    if (!Array.isArray(participation.members)) {
      console.error('[API] members is not an array:', participation.members);
      return NextResponse.json({ error: 'Invalid members data' }, { status: 400 });
    }

    if (index >= participation.members.length) {
      console.log('[API] Invalid participant index:', { index, membersLength: participation.members.length });
      return NextResponse.json({ error: 'Invalid participant index' }, { status: 400 });
    }

    participation.members[index] = newName.trim();
    await participation.save();

    // Update the corresponding Slot document
    const slot = await Slot.findById(participation.slotId);
    if (slot) {
      const participantIndex = slot.participants.findIndex(
        p => p.participationId.toString() === participationId
      );
      
      if (participantIndex !== -1) {
        slot.participants[participantIndex].participantNames[index] = newName.trim();
        await slot.save();
      }
    }

    // Emit socket event with string IDs
    const io = getIO();
    if (io) {
      io.to('admin').emit('participantNameUpdated', {
        slotId: participation.slotId.toString(),
        participationId: participationId.toString(),
        index,
        newName: newName.trim()
      });
      console.log('[API] Emitted participantNameUpdated event:', {
        slotId: participation.slotId.toString(),
        participationId: participationId.toString(),
        index,
        newName: newName.trim()
      });
    } else {
      console.warn('[API] Socket.IO instance not available');
    }

    return NextResponse.json({ message: 'Name updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Error updating participant name:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}