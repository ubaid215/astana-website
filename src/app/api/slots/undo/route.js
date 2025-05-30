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
        // Source slot was completely deleted - recreate it
        const availableSlots = await Slot.find({ day: data.originalDay, cowQuality: targetSlot.cowQuality });
        const occupiedTimeSlots = new Set(availableSlots.map(slot => slot.timeSlot));
        const availableTimes = TIME_SLOTS[data.originalDay].filter(
          time => !occupiedTimeSlots.has(time)
        );
        const timeSlot = availableTimes.includes(data.originalTimeSlot)
          ? data.originalTimeSlot
          : (availableTimes.sort()[0] || data.originalTimeSlot);

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

      // Restore participants to source slot (add back the moved participants)
      for (const participant of data.participants) {
        const existingSourceIdx = sourceSlot.participants.findIndex(
          p => p.participationId.toString() === participant.participationId.toString()
        );

        if (existingSourceIdx !== -1) {
          // Participant already exists in source slot (remaining participants)
          // Add back the moved shares and names
          sourceSlot.participants[existingSourceIdx].shares += participant.shares;
          
          // Merge participant names, avoiding duplicates
          const existingNames = new Set(sourceSlot.participants[existingSourceIdx].participantNames);
          const newNames = participant.participantNames.filter(name => !existingNames.has(name));
          sourceSlot.participants[existingSourceIdx].participantNames = [
            ...sourceSlot.participants[existingSourceIdx].participantNames,
            ...newNames
          ];
          
          // Update collector name if needed
          const currentCollector = sourceSlot.participants[existingSourceIdx].collectorName;
          if (currentCollector !== participant.collectorName) {
            sourceSlot.participants[existingSourceIdx].collectorName = 
              [currentCollector, participant.collectorName]
              .filter(Boolean)
              .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
              .join(' - ');
          }
        } else {
          // Participant doesn't exist in source slot - add them back completely
          sourceSlot.participants.push({
            participationId: participant.participationId,
            shares: participant.shares,
            participantNames: participant.participantNames,
            collectorName: participant.collectorName,
          });
        }
      }

      // Validate shares and participant names consistency
      sourceSlot.participants = sourceSlot.participants.map(participant => {
        const maxShares = participant.participantNames.length;
        const validShares = Math.min(participant.shares, maxShares);
        return {
          ...participant,
          shares: validShares,
          participantNames: participant.participantNames.slice(0, validShares),
        };
      }).filter(participant => participant.shares > 0);

      await sourceSlot.save();
      updatedSlots.push(sourceSlot);

      // Remove the moved participants from target slot
      for (const participant of data.participants) {
        const targetIdx = targetSlot.participants.findIndex(
          p => p.participationId.toString() === participant.participationId.toString()
        );
        
        if (targetIdx !== -1) {
          targetSlot.participants[targetIdx].shares -= participant.shares;
          
          // Remove the specific participant names that were moved
          targetSlot.participants[targetIdx].participantNames = 
            targetSlot.participants[targetIdx].participantNames.filter(
              name => !participant.participantNames.includes(name)
            );
          
          // Update collector name - remove the moved collector's name
          const collectorNames = targetSlot.participants[targetIdx].collectorName.split(' - ');
          const updatedCollectorNames = collectorNames.filter(
            name => name.trim() !== participant.collectorName.trim()
          );
          targetSlot.participants[targetIdx].collectorName = 
            updatedCollectorNames.length > 0 ? updatedCollectorNames.join(' - ') : participant.collectorName;

          // Remove participant if no shares left
          if (targetSlot.participants[targetIdx].shares <= 0) {
            targetSlot.participants.splice(targetIdx, 1);
          }
        }
      }
    }

    // Validate target slot shares and participant names consistency
    targetSlot.participants = targetSlot.participants.map(participant => {
      const maxShares = participant.participantNames.length;
      const validShares = Math.min(participant.shares, maxShares);
      return {
        ...participant,
        shares: validShares,
        participantNames: participant.participantNames.slice(0, validShares),
      };
    }).filter(participant => participant.shares > 0);

    // Clear mergeMetadata and save or delete target slot
    targetSlot.mergeMetadata = [];
    if (targetSlot.participants.length === 0) {
      await Slot.findByIdAndDelete(targetSlot._id);
      updatedSlots.splice(updatedSlots.indexOf(targetSlot), 1);
    } else {
      await targetSlot.save();
    }

    // Emit socket events
    const io = getIO();
    if (io) {
      updatedSlots.forEach(slot => {
        io.to('admin').emit('slotUpdated', slot);
      });
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