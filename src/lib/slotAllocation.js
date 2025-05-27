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
  let remainingParticipants = [...(participation.members || [])];
  const { day, cowQuality, collectorName, _id } = participation;
  let preferredTimeSlot = participation.timeSlot || TIME_SLOTS[day][0]; // Fallback to first time slot

  console.log('[allocateSlot] Starting allocation', {
    participationId: _id,
    shares: remainingShares,
    participantNames: remainingParticipants,
    day,
    cowQuality,
    preferredTimeSlot,
  });

  // Enhanced slot availability check
  const checkSlotAvailability = async () => {
    let totalAvailableCapacity = 0;
    let availableSlotCount = 0;
    let availableSlots = [];
    
    for (const timeSlot of TIME_SLOTS[day]) {
      const existingSlot = await Slot.findOne({ timeSlot, day });
      if (!existingSlot) {
        totalAvailableCapacity += 7;
        availableSlotCount++;
        availableSlots.push({ timeSlot, capacity: 7 });
      } else if (existingSlot.cowQuality === cowQuality) {
        const currentShares = existingSlot.participants.reduce((sum, p) => sum + p.shares, 0);
        const capacity = 7 - currentShares;
        totalAvailableCapacity += capacity;
        if (capacity > 0) {
          availableSlotCount++;
          availableSlots.push({ timeSlot, capacity });
        }
      }
    }
    
    const needsMultipleSlots = remainingShares > 7;
    const minimumRequiredSlots = Math.ceil(remainingShares / 7);
    
    if (totalAvailableCapacity < remainingShares) {
      return {
        success: false,
        message: `Not enough capacity for ${remainingShares} shares. Only ${totalAvailableCapacity} shares available.`,
        totalAvailableCapacity,
        availableSlotCount
      };
    }
    
    if (needsMultipleSlots && availableSlotCount < minimumRequiredSlots) {
      return {
        success: false,
        message: `You need ${minimumRequiredSlots} slots for ${remainingShares} shares but only ${availableSlotCount} slots with total ${totalAvailableCapacity} capacity are available.`,
        totalAvailableCapacity,
        availableSlotCount,
        minimumRequiredSlots
      };
    }
    
    return { 
      success: true,
      totalAvailableCapacity,
      availableSlotCount,
      availableSlots
    };
  };

  const availability = await checkSlotAvailability();
  if (!availability.success) {
    console.error('[allocateSlot] Availability check failed:', availability.message);
    throw new Error(availability.message);
  }

  // Sort available slots by time and cow quality (earliest time for matching cow quality)
  let sortedAvailableSlots = availability.availableSlots.sort((a, b) => {
    // Prioritize slots with matching cowQuality and earlier time
    if (a.timeSlot === preferredTimeSlot && b.timeSlot !== preferredTimeSlot) return -1;
    if (b.timeSlot === preferredTimeSlot && a.timeSlot !== preferredTimeSlot) return 1;
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  // Allocate shares across available slots
  for (const { timeSlot, capacity } of sortedAvailableSlots) {
    if (remainingShares <= 0) break;

    const sharesToAllocate = Math.min(remainingShares, capacity);
    const participantNamesForSlot = remainingParticipants.slice(0, sharesToAllocate);
    remainingParticipants = remainingParticipants.slice(sharesToAllocate);
    remainingShares -= sharesToAllocate;

    // Check if slot exists
    let slot = await Slot.findOne({ timeSlot, day });
    const participantData = {
      participationId: _id,
      collectorName,
      participantNames: participantNamesForSlot,
      shares: sharesToAllocate,
    };

    if (!slot) {
      // Create new slot
      slot = new Slot({
        timeSlot,
        day,
        cowQuality,
        participants: [participantData],
      });
    } else {
      // Update existing slot
      slot.participants.push(participantData);
    }

    await slot.save();
    slots.push(slot);

    console.log('[allocateSlot] Allocated slot', {
      slotId: slot._id,
      timeSlot,
      shares: sharesToAllocate,
      participantNames: participantNamesForSlot,
    });

    // If this is the first slot, update participation with slot details
    if (slots.length === 1) {
      participation.slotId = slot._id;
      participation.timeSlot = slot.timeSlot;
      participation.slotAssigned = true;
    }
  }

  if (remainingShares > 0) {
    console.error('[allocateSlot] Failed to allocate all shares', {
      participationId: _id,
      remainingShares,
    });
    throw new Error(`Failed to allocate ${remainingShares} remaining shares`);
  }

  await participation.save();
  console.log('[allocateSlot] Allocation completed', {
    participationId: _id,
    slots: slots.map(s => s._id),
  });

  return slots;
}