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
      console.warn('[API] Unauthorized access attempt in update-name');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participationId, index, newName } = await req.json();
    console.log('[API] Processing participant name:', { participationId, index, newName });

    // Validate input
    if (!participationId || !participationId.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn('[API] Invalid participation ID:', participationId);
      return NextResponse.json({ error: 'Invalid participation ID' }, { status: 400 });
    }
    if (typeof newName !== 'string' || newName.trim() === '') {
      console.warn('[API] Invalid newName:', newName);
      return NextResponse.json({ error: 'Participant name cannot be empty' }, { status: 400 });
    }

    await connectDB();

    // Find the Participation document
    const participation = await Participation.findById(participationId);
    if (!participation) {
      console.warn('[API] Participation not found for ID:', participationId);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    if (!Array.isArray(participation.members)) {
      console.error('[API] Members is not an array:', participation.members);
      return NextResponse.json({ error: 'Invalid members data' }, { status: 400 });
    }

    let action = 'updated';
    if (index === undefined || index === null) {
      // Add new participant
      participation.members.push(newName.trim());
      action = 'added';
    } else {
      // Update existing participant
      if (typeof index !== 'number' || index < 0 || index >= participation.members.length) {
        console.warn('[API] Invalid participant index:', { index, membersLength: participation.members.length });
        return NextResponse.json({ error: 'Invalid participant index' }, { status: 400 });
      }
      participation.members[index] = newName.trim();
    }

    await participation.save();
    console.log(`[API] Participation ${action}:`, participation._id);

    // Update the corresponding Slot document
    const slot = await Slot.findById(participation.slotId);
    if (slot) {
      const participantIndex = slot.participants.findIndex(
        p => p.participationId.toString() === participationId
      );
      if (participantIndex !== -1) {
        if (index === undefined || index === null) {
          slot.participants[participantIndex].participantNames.push(newName.trim());
        } else {
          slot.participants[participantIndex].participantNames[index] = newName.trim();
        }
        await slot.save();
        console.log('[API] Slot updated:', slot._id);
      }
    }

    // Emit socket event
    const io = getIO();
    if (io) {
      const eventData = {
        slotId: participation.slotId?.toString(),
        participationId: participationId.toString(),
        index: index !== undefined ? index : participation.members.length - 1,
        newName: newName.trim(),
      };
      io.to('admin').emit(index !== undefined ? 'participantNameUpdated' : 'participantAdded', eventData);
      console.log(`[API] Emitted ${index !== undefined ? 'participantNameUpdated' : 'participantAdded'} event:`, eventData);
      if (slot) {
        io.to('admin').emit('slotUpdated', slot);
        console.log('[API] Emitted slotUpdated event:', slot);
      }
    } else {
      console.warn('[API] Socket.IO instance not available');
    }

    return new NextResponse({ message: `Participant ${action} successfully` }, { status: 200 });
  } catch (error) {
    console.error(`[API] Error ${index !== undefined ? 'updating' : 'adding'} participant name:`, {
      message: error.message,
      stack: error.stack,
      participationId: (await req.json())?.participationId,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}