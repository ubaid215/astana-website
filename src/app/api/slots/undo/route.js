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
    const { slotId } = await req.json();

    let targetSlot;
    if (slotId) {
      targetSlot = await Slot.findById(slotId);
      if (!targetSlot || !targetSlot.mergeMetadata || targetSlot.mergeMetadata.length === 0) {
        return NextResponse.json({ error: 'No merge data found for this slot' }, { status: 404 });
      }
    } else {
      // Find the most recently merged slot
      targetSlot = await Slot.findOne({ mergeMetadata: { $exists: true, $ne: [] } })
        .sort({ updatedAt: -1 })
        .exec();
      if (!targetSlot) {
        return NextResponse.json({ error: 'No merge operations to undo' }, { status: 404 });
      }
    }

    const mergeMetadata = targetSlot.mergeMetadata;
    if (!mergeMetadata || mergeMetadata.length === 0) {
      return NextResponse.json({ error: 'No merge data to undo' }, { status: 404 });
    }

    // Group metadata by source slot for accurate restoration
    const sourceSlotsData = {};
    mergeMetadata.forEach(meta => {
      const key = `${meta.sourceSlotId}-${meta.originalDay}`;
      if (!sourceSlotsData[key]) {
        sourceSlotsData[key] = {
          sourceSlotId: meta.sourceSlotId,
          originalDay: meta.originalDay,
          originalTimeSlot: meta.originalTimeSlot,
          participants: [],
        };
      }
      sourceSlotsData[key].participants.push({
        participationId: meta.participationId,
        shares: meta.shares,
        participantNames: meta.participantNames,
        collectorName: meta.collectorName,
      });
    });

    const updatedSlots = [targetSlot];
    for (const [key, data] of Object.entries(sourceSlotsData)) {
      let sourceSlot = await Slot.findById(data.sourceSlotId);
      if (!sourceSlot) {
        // Recreate source slot
        const availableSlots = await Slot.find({ day: data.originalDay, cowQuality: targetSlot.cowQuality });
        const availableTimes = TIME_SLOTS[data.originalDay].filter(
          (time) => !availableSlots.some((slot) => slot.timeSlot === time)
        );
        const timeSlot = availableTimes.includes(data.originalTimeSlot) ? data.originalTimeSlot : (availableTimes.sort()[0] || data.originalTimeSlot);
        sourceSlot = new Slot({
          _id: data.sourceSlotId,
          timeSlot,
          day: data.originalDay,
          cowQuality: targetSlot.cowQuality,
          participants: [],
          completed: false,
          mergeMetadata: [],
        });
      }

      // Restore participants to source slot
      for (const participant of data.participants) {
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
          sourceSlot.participants[existingSourceIdx].collectorName = participant.collectorName;
        } else {
          sourceSlot.participants.push({
            participationId: participant.participationId,
            shares: participant.shares,
            participantNames: participant.participantNames,
            collectorName: participant.collectorName,
          });
        }
      }

      await sourceSlot.save();
      updatedSlots.push(sourceSlot);

      // Remove participants from target slot
      for (const participant of data.participants) {
        const targetIdx = targetSlot.participants.findIndex(
          p => p.participationId.toString() === participant.participationId.toString()
        );
        if (targetIdx !== -1) {
          targetSlot.participants[targetIdx].shares -= participant.shares;
          targetSlot.participants[targetIdx].participantNames = targetSlot.participants[targetIdx].participantNames.filter(
            name => !participant.participantNames.includes(name)
          );
          targetSlot.participants[targetIdx].collectorName = targetSlot.participants[targetIdx].collectorName
            .split(' - ')
            .filter(name => name !== participant.collectorName)
            .join(' - ') || targetSlot.participants[targetIdx].collectorName;
          if (targetSlot.participants[targetIdx].shares <= 0) {
            targetSlot.participants.splice(targetIdx, 1);
          }
        }
      }
    }

    // Clear mergeMetadata and save or delete target slot
    targetSlot.mergeMetadata = [];
    if (targetSlot.participants.length === 0) {
      await Slot.findByIdAndDelete(targetSlot._id);
      updatedSlots.splice(updatedSlots.indexOf(targetSlot), 1);
    } else {
      await targetSlot.save();
    }

    const io = getIO();
    if (io) {
      updatedSlots.forEach(slot => io.to('admin').emit('slotUpdated', slot));
      if (targetSlot.participants.length === 0) {
        io.to('admin').emit('slotDeleted', { slotId: targetSlot._id });
      }
      io.to('admin').emit('mergeUndone', { slotId: targetSlot._id });
    }

    const allSlots = await Slot.find();
    return NextResponse.json(allSlots, { status: 200 });
  } catch (error) {
    console.error('[API] Undo merge error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const mergeCount = await Slot.countDocuments({ mergeMetadata: { $exists: true, $ne: [] } });
    return NextResponse.json({ canUndo: mergeCount > 0 }, { status: 200 });
  } catch (error) {
    console.error('[API] Undo availability check error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}