import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import MergeHistory from '@/lib/db/models/MergeHistory';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(req) {
  try {
    console.log('[API] /api/slots/undo POST request received');

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('[API] MongoDB connected');

    // Find the most recent merge operation (allow any admin to undo any merge)
    const lastMerge = await MergeHistory.findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastMerge) {
      console.warn('[API] No merge operations found');
      return NextResponse.json({ error: 'No merge operations to undo' }, { status: 404 });
    }

    console.log('[API] Found merge to undo:', lastMerge._id);

    const { sourceSlotId, destSlotId, sourceDay, destDay, movedParticipants } = lastMerge;

    let sourceSlot = await Slot.findById(sourceSlotId);
    let targetSlot = destSlotId ? await Slot.findById(destSlotId) : null;

    if (!sourceSlot) {
      console.log('[API] Recreating source slot:', sourceSlotId);
      sourceSlot = new Slot({
        _id: sourceSlotId,
        timeSlot: movedParticipants[0]?.timeSlot || '00:00',
        day: sourceDay,
        cowQuality: movedParticipants[0]?.cowQuality || targetSlot?.cowQuality,
        participants: [],
        completed: false,
      });
    }

    if (destSlotId && !targetSlot) {
      console.error('[API] Target slot not found:', destSlotId);
      return NextResponse.json({ error: 'Target slot not found' }, { status: 404 });
    }

    // Restore participants to source slot
    for (const participant of movedParticipants) {
      const existingSourceIdx = sourceSlot.participants.findIndex(
        p => p.participationId.toString() === participant.participationId.toString()
      );
      if (existingSourceIdx !== -1) {
        sourceSlot.participants[existingSourceIdx].shares += participant.shares;
        sourceSlot.participants[existingSourceIdx].participantNames = [
          ...new Set([
            ...sourceSlot.participants[existingSourceIdx].participantNames,
            ...participant.participantNames,
          ]),
        ];
        // Deduplicate collector names and join
        const collectorNames = new Set([
          sourceSlot.participants[existingSourceIdx].collectorName,
          participant.collectorName,
        ].filter(Boolean));
        sourceSlot.participants[existingSourceIdx].collectorName = [...collectorNames].join(' - ');
      } else {
        sourceSlot.participants.push({
          participationId: participant.participationId,
          shares: participant.shares,
          participantNames: participant.participantNames,
          collectorName: participant.collectorName,
        });
      }
    }

    if (targetSlot) {
      // Remove moved participants from target slot
      for (const participant of movedParticipants) {
        const targetIdx = targetSlot.participants.findIndex(
          p => p.participationId.toString() === participant.participationId.toString()
        );
        if (targetIdx !== -1) {
          targetSlot.participants[targetIdx].shares -= participant.shares;
          targetSlot.participants[targetIdx].participantNames = targetSlot.participants[
            targetIdx
          ].participantNames.filter(
            name => !participant.participantNames.includes(name)
          );
          if (targetSlot.participants[targetIdx].shares <= 0) {
            targetSlot.participants.splice(targetIdx, 1);
          }
        }
      }

      if (targetSlot.participants.length === 0) {
        console.log('[API] Deleting empty target slot:', destSlotId);
        await Slot.findByIdAndDelete(destSlotId);
        targetSlot = null; // Set to null to indicate deletion
      } else {
        console.log('[API] Saving updated target slot:', targetSlot._id);
        await targetSlot.save();
      }
    }

    console.log('[API] Saving updated source slot:', sourceSlot._id);
    await sourceSlot.save();

    // Delete the merge history record
    console.log('[API] Deleting merge history:', lastMerge._id);
    await MergeHistory.findByIdAndDelete(lastMerge._id);

    const io = getIO();
    if (io) {
      console.log('[API] Emitting socket events');
      io.to('admin').emit('slotUpdated', sourceSlot);
      if (destSlotId) {
        if (targetSlot) {
          io.to('admin').emit('slotUpdated', targetSlot);
        } else {
          io.to('admin').emit('slotDeleted', { slotId: destSlotId });
        }
      }
      io.to('admin').emit('mergeUndone', { mergeId: lastMerge._id });
    } else {
      console.warn('[API] Socket.IO instance not initialized');
    }

    // Return only the affected slots
    const updatedSlots = [sourceSlot];
    if (targetSlot) updatedSlots.push(targetSlot);
    console.log('[API] Returning updated slots:', updatedSlots.length);
    return NextResponse.json(updatedSlots, { status: 200 });
  } catch (error) {
    console.error('[API] Undo merge error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    console.log('[API] /api/slots/undo GET request received');
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    console.log('[API] MongoDB connected');
    const mergeCount = await MergeHistory.countDocuments();
    console.log('[API] Merge history count:', mergeCount);
    return NextResponse.json({ canUndo: mergeCount > 0 }, { status: 200 });
  } catch (error) {
    console.error('[API] Undo availability check error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}