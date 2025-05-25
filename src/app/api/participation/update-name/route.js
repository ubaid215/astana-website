// In your API route (e.g., /api/participation/update-name/route.js)
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
      return NextResponse.json({ error: 'Invalid participation ID' }, { status: 400 });
    }
    if (typeof index !== 'number' || index < 0) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }
    if (typeof newName !== 'string' || newName.trim() === '') {
      return NextResponse.json({ error: 'Participant name cannot be empty' }, { status: 400 });
    }

    await connectDB();

    // Update the Participation document
    const participation = await Participation.findById(participationId);
    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    if (index >= participation.participantNames.length) {
      return NextResponse.json({ error: 'Invalid participant index' }, { status: 400 });
    }

    participation.participantNames[index] = newName.trim();
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

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to('admin').emit('participantNameUpdated', {
        slotId: participation.slotId,
        participationId,
        index,
        newName: newName.trim()
      });
    }

    return NextResponse.json({ message: 'Name updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating participant name:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}