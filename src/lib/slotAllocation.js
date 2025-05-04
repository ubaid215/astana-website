import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { TIME_SLOTS } from '@/lib/utils';

export async function allocateSlot(participation) {
  await connectDB();

  const { timeSlot, day, cowQuality, country, shares, collectorName, members, _id } = participation;

  if (timeSlot) {
    // Try to assign to requested time slot
    let slot = await Slot.findOne({ timeSlot, day, cowQuality, country });
    if (slot) {
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + shares <= 7) {
        slot.participants.push({ participationId: _id, collectorName, members, shares });
        await slot.save();
        participation.slotId = slot._id;
        participation.slotAssigned = true;
        await participation.save();
        return slot;
      }
    } else {
      // Create new slot if space allows
      const newSlot = new Slot({
        timeSlot,
        day,
        cowQuality,
        country,
        participants: [{ participationId: _id, collectorName, members, shares }],
      });
      await newSlot.save();
      participation.slotId = newSlot._id;
      participation.slotAssigned = true;
      await participation.save();
      return newSlot;
    }
  }

  // Randomly assign if no time slot or requested slot is full
  for (const slotTime of TIME_SLOTS) {
    let slot = await Slot.findOne({ timeSlot: slotTime, day, cowQuality, country });
    if (slot) {
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + shares <= 7) {
        slot.participants.push({ participationId: _id, collectorName, members, shares });
        await slot.save();
        participation.slotId = slot._id;
        participation.timeSlot = slotTime;
        participation.slotAssigned = true;
        await participation.save();
        return slot;
      }
    } else {
      const newSlot = new Slot({
        timeSlot: slotTime,
        day,
        cowQuality,
        country,
        participants: [{ participationId: _id, collectorName, members, shares }],
      });
      await newSlot.save();
      participation.slotId = newSlot._id;
      participation.timeSlot = slotTime;
      participation.slotAssigned = true;
      await participation.save();
      return newSlot;
    }
  }

  throw new Error('No available slots');
}