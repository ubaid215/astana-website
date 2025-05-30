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
    const { sourceSlotId, destSlotId, sourceDay, destDay, partialMove } = await req.json();

    const sourceSlot = await Slot.findById(sourceSlotId).lean();
    if (!sourceSlot) {
      return NextResponse.json({ error: 'Source slot not found' }, { status: 404 });
    }

    let targetSlot = destSlotId ? await Slot.findById(destSlotId).lean() : null;

    if (destSlotId) {
      if (!targetSlot) {
        return NextResponse.json({ error: 'Target slot not found' }, { status: 404 });
      }
      if (sourceSlot.cowQuality !== targetSlot.cowQuality) {
        return NextResponse.json({ error: 'Slots must have the same cow quality' }, { status: 400 });
      }
    } else {
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
    let updatedSourceParticipants = [...sourceSlot.participants];
    const updatedTargetParticipants = [...(targetSlot.participants || [])];
    const mergeMetadata = [];

    // Store original state for undo
    const originalSourceState = { ...sourceSlot, participants: [...sourceSlot.participants] };
    const originalTargetState = targetSlot._id ? { ...targetSlot, participants: [...targetSlot.participants] } : null;

    // Handle partial move for cross-day merging
    const isCrossDay = sourceDay !== destDay;
    if (partialMove && isCrossDay && remainingShares > availableCapacity) {
      for (const sourceParticipant of sourceSlot.participants) {
        if (remainingShares <= 0) break;

        const sharesToMove = Math.min(sourceParticipant.shares, availableCapacity);
        if (sharesToMove <= 0) continue;

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
          targetSlotId: targetSlot._id,
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
    } else {
      // Full move for same-day or when partial move is not requested
      for (const sourceParticipant of sourceSlot.participants) {
        if (remainingShares <= 0) break;

        const sharesToMove = Math.min(sourceParticipant.shares, availableCapacity);
        if (sharesToMove <= 0) continue;

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
          targetSlotId: targetSlot._id,
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
    }

    // Preserve remaining participants in source slot
    if (remainingShares > 0 && updatedSourceParticipants.length > 0) {
      const updatedSource = await Slot.findByIdAndUpdate(
        sourceSlotId,
        { $set: { participants: updatedSourceParticipants } },
        { new: true, runValidators: true }
      );
    } else if (updatedSourceParticipants.length === 0) {
      await Slot.findByIdAndDelete(sourceSlotId);
    }

    // Save target slot with merge metadata
    let updatedTargetSlot;
    if (!targetSlot._id) {
      targetSlot.participants = updatedTargetParticipants;
      targetSlot.mergeMetadata = mergeMetadata;
      updatedTargetSlot = await targetSlot.save();
    } else {
      updatedTargetSlot = await Slot.findByIdAndUpdate(
        targetSlot._id,
        { $set: { participants: updatedTargetParticipants, mergeMetadata: mergeMetadata } },
        { new: true, runValidators: true }
      );
    }

    // Store undo data
    await Slot.findByIdAndUpdate(
      updatedTargetSlot._id,
      { $push: { undoHistory: { originalSourceState, originalTargetState, timestamp: new Date() } } },
      { new: true, runValidators: true }
    );

    const io = getIO();
    if (io) {
      io.to('admin').emit('slotUpdated', updatedTargetSlot);
      if (remainingShares > 0 && updatedSourceParticipants.length > 0) {
        const updatedSourceSlot = await Slot.findById(sourceSlotId);
        io.to('admin').emit('slotUpdated', updatedSourceSlot);
      } else {
        io.to('admin').emit('slotDeleted', sourceSlotId); // Emit slotId directly
      }
      io.to('admin').emit('mergePerformed', { slotId: updatedTargetSlot._id });
    }

    const allSlots = await Slot.find();
    return NextResponse.json(allSlots, { status: 200 });
  } catch (error) {
    console.error('[API] Merge slots error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}