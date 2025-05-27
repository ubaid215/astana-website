import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { TIME_SLOTS } from '@/lib/utils';
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

    const sourceSlot = await Slot.findById(sourceSlotId);
    if (!sourceSlot) {
      return NextResponse.json({ error: 'Source slot not found' }, { status: 404 });
    }

    let targetSlot;

    if (destSlotId) {
      // Dropping onto a specific target slot
      targetSlot = await Slot.findById(destSlotId);
      if (!targetSlot) {
        return NextResponse.json({ error: 'Target slot not found' }, { status: 404 });
      }
      if (sourceSlot.cowQuality !== targetSlot.cowQuality) {
        return NextResponse.json({ error: 'Slots must have the same cow quality' }, { status: 400 });
      }
    } else {
      // Day drop: Find or create a new slot ensuring unique time slot across all cow qualities
      const allSlotsForDay = await Slot.find({ day: destDay });
      const occupiedTimeSlots = new Set(allSlotsForDay.map(slot => slot.timeSlot));
      const availableTimeSlots = (TIME_SLOTS[destDay] || []).filter(time => !occupiedTimeSlots.has(time));

      if (availableTimeSlots.length === 0) {
        return NextResponse.json({ error: 'No available time slots on destination day' }, { status: 400 });
      }

      const selectedTimeSlot = availableTimeSlots[0];

      targetSlot = new Slot({
        timeSlot: selectedTimeSlot,
        day: destDay,
        cowQuality: sourceSlot.cowQuality,
        participants: [],
        completed: false,
        mergeMetadata: [],
      });
    }

    const totalTargetShares = targetSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    let availableCapacity = 7 - totalTargetShares;
    let remainingShares = sourceSlot.participants.reduce((sum, p) => sum + p.shares, 0);

    if (remainingShares <= 0) {
      return NextResponse.json({ error: 'No shares to merge' }, { status: 400 });
    }

    if (availableCapacity <= 0) {
      return NextResponse.json({ error: 'Target slot is full' }, { status: 400 });
    }

    const updatedTargetParticipants = [...targetSlot.participants];
    const updatedSourceParticipants = [...sourceSlot.participants];
    const mergeMetadata = [];

    for (const sourceParticipant of sourceSlot.participants) {
      if (remainingShares <= 0 || availableCapacity <= 0) break;

      if (!sourceParticipant.participationId) continue;

      const sharesToMove = Math.min(sourceParticipant.shares, availableCapacity);
      const namesToMove = sourceParticipant.participantNames.slice(0, sharesToMove);

      const existingIdx = updatedTargetParticipants.findIndex(
        p => p.participationId?.toString() === sourceParticipant.participationId.toString()
      );

      if (existingIdx !== -1) {
        updatedTargetParticipants[existingIdx].shares += sharesToMove;
        updatedTargetParticipants[existingIdx].participantNames = [
          ...new Set([...updatedTargetParticipants[existingIdx].participantNames, ...namesToMove]),
        ];
        updatedTargetParticipants[existingIdx].collectorName = [
          updatedTargetParticipants[existingIdx].collectorName,
          sourceParticipant.collectorName,
        ].filter(Boolean).join(' - ');
      } else {
        updatedTargetParticipants.push({
          ...sourceParticipant,
          shares: sharesToMove,
          participantNames: namesToMove,
        });
      }

      mergeMetadata.push({
        participationId: sourceParticipant.participationId,
        shares: sharesToMove,
        participantNames: namesToMove,
        collectorName: sourceParticipant.collectorName,
        originalTimeSlot: sourceSlot.timeSlot,
        originalDay: sourceDay,
        sourceSlotId: sourceSlot._id,
      });

      const sourceIdx = updatedSourceParticipants.findIndex(
        p => p.participationId?.toString() === sourceParticipant.participationId.toString()
      );
      if (sourceIdx !== -1) {
        updatedSourceParticipants[sourceIdx].shares -= sharesToMove;
        updatedSourceParticipants[sourceIdx].participantNames =
          updatedSourceParticipants[sourceIdx].participantNames.slice(sharesToMove);
        if (updatedSourceParticipants[sourceIdx].shares <= 0) {
          updatedSourceParticipants.splice(sourceIdx, 1);
        }
      }

      remainingShares -= sharesToMove;
      availableCapacity -= sharesToMove;
    }

    targetSlot.participants = updatedTargetParticipants;
    targetSlot.mergeMetadata = [...(targetSlot.mergeMetadata || []), ...mergeMetadata];
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
      io.to('admin').emit('mergePerformed', { slotId: targetSlot._id });
    }

    const allSlots = await Slot.find();
    return NextResponse.json(allSlots, { status: 200 });
  } catch (error) {
    console.error('[API] Merge slots error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
