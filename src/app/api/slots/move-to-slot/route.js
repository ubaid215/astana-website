import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { getIO } from '@/lib/socket';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { sourceSlotId, participationId, targetSlotId } = await req.json();

    if (!sourceSlotId || !participationId || !targetSlotId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find source and target slots
    const [sourceSlot, targetSlot] = await Promise.all([
      Slot.findById(sourceSlotId),
      Slot.findById(targetSlotId)
    ]);

    if (!sourceSlot || !targetSlot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Find participant in source slot
    const participantIndex = sourceSlot.participants.findIndex(
      p => p.participationId.toString() === participationId
    );
    
    if (participantIndex === -1) {
      return NextResponse.json({ error: 'Participant not found in source slot' }, { status: 404 });
    }

    const participant = sourceSlot.participants[participantIndex];

    // Check target slot capacity
    const currentShares = targetSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    if (currentShares + participant.shares > 7) {
      return NextResponse.json(
        { error: 'Target slot cannot accommodate this participant' },
        { status: 400 }
      );
    }

    // Move participant
    sourceSlot.participants.splice(participantIndex, 1);
    targetSlot.participants.push(participant);

    // Update participation record
    await Participation.findByIdAndUpdate(participationId, {
      slotId: targetSlot._id,
      timeSlot: targetSlot.timeSlot
    });

    // Save changes
    await Promise.all([sourceSlot.save(), targetSlot.save()]);

    // Emit socket events
    const io = getIO();
    if (io) {
      io.to('admin').emit('slotUpdated', sourceSlot);
      io.to('admin').emit('slotUpdated', targetSlot);
    }

    return NextResponse.json(
      { message: 'Participant moved successfully', sourceSlot, targetSlot },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Move Participant API] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}