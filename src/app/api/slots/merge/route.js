import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { sourceSlotId, destSlotId, sourceDay, destDay } = await req.json();
    console.log('[API] Merge slots request:', { sourceSlotId, destSlotId, sourceDay, destDay });

    const sourceSlot = await Slot.findById(sourceSlotId);
    if (!sourceSlot) {
      return NextResponse.json({ error: 'Source slot not found' }, { status: 404 });
    }

    let targetSlot;
    if (destSlotId) {
      targetSlot = await Slot.findById(destSlotId);
      if (!targetSlot) {
        return NextResponse.json({ error: 'Target slot not found' }, { status: 404 });
      }
    } else {
      // Day drop: Find or create a slot with the same timeSlot and cowQuality
      targetSlot = await Slot.findOne({ timeSlot: sourceSlot.timeSlot, day: destDay, cowQuality: sourceSlot.cowQuality });
      if (!targetSlot) {
        targetSlot = new Slot({
          timeSlot: sourceSlot.timeSlot,
          day: destDay,
          cowQuality: sourceSlot.cowQuality,
          participants: [],
          completed: false,
        });
      }
    }

    if (sourceSlot.cowQuality !== targetSlot.cowQuality) {
      return NextResponse.json({ error: 'Slots must have the same cow quality' }, { status: 400 });
    }

    const totalTargetShares = targetSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    let availableCapacity = 7 - totalTargetShares;
    let remainingShares = sourceSlot.participants.reduce((sum, p) => sum + p.shares, 0);

    if (remainingShares <= 0) {
      return NextResponse.json({ error: 'No shares to merge' }, { status: 400 });
    }

    // Merge or partially allocate participants
    const updatedTargetParticipants = [...targetSlot.participants];
    const updatedSourceParticipants = [...sourceSlot.participants];

    for (const sourceParticipant of sourceSlot.participants) {
      if (remainingShares <= 0 || availableCapacity <= 0) break;

      const sharesToMove = Math.min(sourceParticipant.shares, availableCapacity);
      const participantNamesToMove = sourceParticipant.participantNames.slice(0, sharesToMove);

      const existingParticipantIdx = updatedTargetParticipants.findIndex(
        p => p.participationId.toString() === sourceParticipant.participationId.toString()
      );

      if (existingParticipantIdx !== -1) {
        updatedTargetParticipants[existingParticipantIdx].shares += sharesToMove;
        updatedTargetParticipants[existingParticipantIdx].participantNames = [
          ...new Set([
            ...updatedTargetParticipants[existingParticipantIdx].participantNames,
            ...participantNamesToMove,
          ]),
        ];
        updatedTargetParticipants[existingParticipantIdx].collectorName = [
          updatedTargetParticipants[existingParticipantIdx].collectorName,
          sourceParticipant.collectorName,
        ].filter(Boolean).join(' - ');
      } else {
        updatedTargetParticipants.push({
          ...sourceParticipant,
          shares: sharesToMove,
          participantNames: participantNamesToMove,
          collectorName: sourceParticipant.collectorName,
        });
      }

      const sourceIdx = updatedSourceParticipants.findIndex(
        p => p.participationId.toString() === sourceParticipant.participationId.toString()
      );
      if (sourceIdx !== -1) {
        updatedSourceParticipants[sourceIdx].shares -= sharesToMove;
        updatedSourceParticipants[sourceIdx].participantNames = updatedSourceParticipants[sourceIdx].participantNames.slice(sharesToMove);
        if (updatedSourceParticipants[sourceIdx].shares <= 0) {
          updatedSourceParticipants.splice(sourceIdx, 1);
        }
      }

      remainingShares -= sharesToMove;
      availableCapacity -= sharesToMove;
    }

    // Update slots
    targetSlot.participants = updatedTargetParticipants;
    await targetSlot.save();

    if (updatedSourceParticipants.length > 0) {
      sourceSlot.participants = updatedSourceParticipants;
      await sourceSlot.save();
    } else {
      await Slot.findByIdAndDelete(sourceSlotId);
    }

    const io = getIO();
    if (io) {
      io.to('admin').emit('slotUpdated', targetSlot);
      if (updatedSourceParticipants.length > 0) {
        io.to('admin').emit('slotUpdated', sourceSlot);
      } else {
        io.to('admin').emit('slotDeleted', { slotId: sourceSlotId });
      }
    }

    // Return all slots to update the state
    const allSlots = await Slot.find();
    return NextResponse.json(allSlots, { status: 200 });
  } catch (error) {
    console.error('[API] Merge slots error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}