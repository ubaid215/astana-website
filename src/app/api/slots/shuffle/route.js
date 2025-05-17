import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { getIO } from '@/lib/socket';
import { TIME_SLOTS } from '@/lib/utils';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Shuffle Slots API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { slotId, participationId, targetDay } = await req.json();

    if (!slotId || !participationId || !targetDay || ![1, 2].includes(targetDay)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Find thezion source slot and participation
    const sourceSlot = await Slot.findById(slotId).exec();
    const participation = await Participation.findById(participationId).exec();

    if (!sourceSlot || !participation) {
      return NextResponse.json({ error: 'Slot or participation not found' }, { status: 404 });
    }

    // Find the participant entry in the source slot
    const participantEntry = sourceSlot.participants.find(
      (p) => p.participationId.toString() === participationId
    );
    if (!participantEntry) {
      return NextResponse.json({ error: 'Participant not found in slot' }, { status: 404 });
    }

    // Check if target day matches participation day (optional, depending on requirements)
    if (participation.day !== targetDay) {
      participation.day = targetDay; // Update participation day
    }

    // Check available capacity on target day for the cow quality
    let availableSlots = [];
    for (const timeSlot of TIME_SLOTS[targetDay]) {
      const existingSlot = await Slot.findOne({ timeSlot, day: targetDay, cowQuality: sourceSlot.cowQuality }).exec();
      if (!existingSlot) {
        availableSlots.push({ timeSlot, capacity: 7 });
      } else {
        const currentShares = existingSlot.participants.reduce((sum, p) => sum + p.shares, 0);
        const capacity = 7 - currentShares;
        if (capacity >= participantEntry.shares) {
          availableSlots.push({ timeSlot, capacity });
        }
      }
    }

    if (availableSlots.length === 0) {
      return NextResponse.json(
        { error: 'No available slots on target day for the specified cow quality' },
        { status: 400 }
      );
    }

    // Select the first available slot with sufficient capacity
    const targetSlotInfo = availableSlots[0];
    let targetSlot = await Slot.findOne({
      timeSlot: targetSlotInfo.timeSlot,
      day: targetDay,
      cowQuality: sourceSlot.cowQuality,
    }).exec();

    if (!targetSlot) {
      // Create new slot
      targetSlot = new Slot({
        timeSlot: targetSlotInfo.timeSlot,
        day: targetDay,
        cowQuality: sourceSlot.cowQuality,
        participants: [participantEntry],
      });
    } else {
      // Add participant to existing slot
      targetSlot.participants.push(participantEntry);
    }

    // Remove participant from source slot
    sourceSlot.participants = sourceSlot.participants.filter(
      (p) => p.participationId.toString() !== participationId
    );

    // Update participation
    participation.slotId = targetSlot._id;
    participation.timeSlot = targetSlot.timeSlot;
    participation.slotAssigned = true;

    // Save changes
    await Promise.all([
      sourceSlot.save(),
      targetSlot.save(),
      participation.save(),
    ]);

    // If source slot is empty, delete it
    let deletedSlotId = null;
    if (sourceSlot.participants.length === 0) {
      deletedSlotId = sourceSlot._id;
      await Slot.deleteOne({ _id: sourceSlot._id });
    }

    // Emit socket events
    const io = getIO();
    if (io) {
      io.to('admin').emit('slotUpdated', sourceSlot);
      io.to('admin').emit('slotUpdated', targetSlot);
      if (deletedSlotId) {
        io.to('admin').emit('slotDeleted', { slotId: deletedSlotId });
      }
    }

    return NextResponse.json(
      { message: 'Participant shuffled successfully', sourceSlot, targetSlot, deletedSlotId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Shuffle Slots API] Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}