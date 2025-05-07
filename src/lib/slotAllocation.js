import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { TIME_SLOTS } from '@/lib/utils';

export async function allocateSlot(participation) {
  await connectDB();
  const slots = [];
  let remainingShares = participation.shares;
  let remainingMembers = [...participation.members];
  const { timeSlot, day, cowQuality, country, collectorName, _id } = participation;

  // Handle cases with <= 7 shares
  if (remainingShares <= 7 && timeSlot) {
    let slot = await Slot.findOne({ timeSlot, day, cowQuality, country });
    if (slot) {
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + remainingShares <= 7) {
        slot.participants.push({ participationId: _id, collectorName, members: remainingMembers, shares: remainingShares });
        await slot.save();
        participation.slotId = slot._id;
        participation.slotAssigned = true;
        await participation.save();
        return [slot];
      }
    } else {
      const newSlot = new Slot({
        timeSlot,
        day,
        cowQuality,
        country,
        participants: [{ participationId: _id, collectorName, members: remainingMembers, shares: remainingShares }],
      });
      await newSlot.save();
      participation.slotId = newSlot._id;
      participation.slotAssigned = true;
      await participation.save();
      return [newSlot];
    }
  }

  // Handle cases with > 7 shares or no timeSlot
  while (remainingShares > 0) {
    const sharesToAllocate = Math.min(remainingShares, 7);
    const membersToAllocate = remainingMembers.slice(0, sharesToAllocate);
    remainingMembers = remainingMembers.slice(sharesToAllocate);
    remainingShares -= sharesToAllocate;

    for (const slotTime of TIME_SLOTS) {
      let slot = await Slot.findOne({ timeSlot: slotTime, day, cowQuality, country });
      if (slot) {
        const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
        if (totalShares + sharesToAllocate <= 7) {
          slot.participants.push({ participationId: _id, collectorName, members: membersToAllocate, shares: sharesToAllocate });
          await slot.save();
          if (!participation.slotId) {
            participation.slotId = slot._id;
            participation.timeSlot = slotTime;
            participation.slotAssigned = true;
            await participation.save();
          }
          slots.push(slot);
          break;
        }
      } else {
        const newSlot = new Slot({
          timeSlot: slotTime,
          day,
          cowQuality,
          country,
          participants: [{ participationId: _id, collectorName, members: membersToAllocate, shares: sharesToAllocate }],
        });
        await newSlot.save();
        if (!participation.slotId) {
          participation.slotId = newSlot._id;
          participation.timeSlot = slotTime;
          participation.slotAssigned = true;
          await participation.save();
        }
        slots.push(newSlot);
        break;
      }
    }
  }

  if (slots.length === 0) {
    throw new Error('No available slots');
  }

  return slots;
}