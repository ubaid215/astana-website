import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { TIME_SLOTS } from '@/lib/utils';

export async function allocateSlot(participation) {
  await connectDB();

  // Check payment status
  if (participation.paymentStatus !== 'Completed') {
    console.log('[allocateSlot] Skipping slot allocation: paymentStatus is not Completed', {
      participationId: participation._id,
      paymentStatus: participation.paymentStatus,
    });
    return [];
  }

  const slots = [];
  let remainingShares = participation.shares;
  let remainingParticipants = [...(participation.members || [])]; // Use members instead of participantNames
  const { day, cowQuality, country, collectorName, _id } = participation;
  // Use provided timeSlot or select a random one from TIME_SLOTS if not provided
  let timeSlot = participation.timeSlot || TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];

  console.log('[allocateSlot] Starting allocation', {
    participationId: _id,
    shares: remainingShares,
    participantNames: remainingParticipants,
    day,
    cowQuality,
    country,
    timeSlot,
  });

  // Handle cases with <= 7 shares
  if (remainingShares <= 7) {
    let slot = await Slot.findOne({ timeSlot, day, cowQuality, country });
    if (slot) {
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + remainingShares <= 7) {
        console.log('[allocateSlot] Adding to existing slot', { slotId: slot._id });
        slot.participants.push({
          participationId: _id,
          collectorName,
          participantNames: remainingParticipants,
          shares: remainingShares,
        });
        await slot.save();
        participation.slotId = slot._id;
        participation.timeSlot = timeSlot;
        participation.slotAssigned = true;
        await participation.save();
        slots.push(slot);
        return slots;
      }
    } else {
      console.log('[allocateSlot] Creating new slot');
      const newSlot = new Slot({
        timeSlot,
        day,
        cowQuality,
        country,
        participants: [
          {
            participationId: _id,
            collectorName,
            participantNames: remainingParticipants,
            shares: remainingShares,
          },
        ],
      });
      await newSlot.save();
      participation.slotId = newSlot._id;
      participation.timeSlot = timeSlot;
      participation.slotAssigned = true;
      await participation.save();
      slots.push(newSlot);
      return slots;
    }
  }

  // Handle cases with > 7 shares
  while (remainingShares > 0) {
    const sharesToAllocate = Math.min(remainingShares, 7);
    const participantsToAllocate = remainingParticipants.slice(0, sharesToAllocate);
    remainingParticipants = remainingParticipants.slice(sharesToAllocate);
    remainingShares -= sharesToAllocate;

    // Try each time slot until a suitable one is found
    let allocated = false;
    for (const slotTime of TIME_SLOTS) {
      let slot = await Slot.findOne({ timeSlot: slotTime, day, cowQuality, country });
      if (slot) {
        const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
        if (totalShares + sharesToAllocate <= 7) {
          console.log('[allocateSlot] Adding to existing slot', { slotId: slot._id, timeSlot: slotTime });
          slot.participants.push({
            participationId: _id,
            collectorName,
            participantNames: participantsToAllocate,
            shares: sharesToAllocate,
          });
          await slot.save();
          if (!participation.slotId) {
            participation.slotId = slot._id;
            participation.timeSlot = slotTime;
            participation.slotAssigned = true;
            await participation.save();
          }
          slots.push(slot);
          allocated = true;
          break;
        }
      } else {
        console.log('[allocateSlot] Creating new slot', { timeSlot: slotTime });
        const newSlot = new Slot({
          timeSlot: slotTime,
          day,
          cowQuality,
          country,
          participants: [
            {
              participationId: _id,
              collectorName,
              participantNames: participantsToAllocate,
              shares: sharesToAllocate,
            },
          ],
        });
        await newSlot.save();
        if (!participation.slotId) {
          participation.slotId = newSlot._id;
          participation.timeSlot = slotTime;
          participation.slotAssigned = true;
          await participation.save();
        }
        slots.push(newSlot);
        allocated = true;
        break;
      }
    }

    if (!allocated) {
      console.error('[allocateSlot] No available slots for allocation', {
        participationId: _id,
        sharesToAllocate,
        day,
        cowQuality,
        country,
      });
      throw new Error('No available slots');
    }
  }

  console.log('[allocateSlot] Allocation completed', { participationId: _id, slots: slots.map(s => s._id) });
  return slots;
}