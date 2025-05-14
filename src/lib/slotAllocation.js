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
  const { day, cowQuality, country, collectorName, _id } = participation;
  let preferredTimeSlot = participation.timeSlot;

  console.log('[allocateSlot] Starting allocation', {
    participationId: _id,
    shares: remainingShares,
    participantNames: remainingParticipants,
    day,
    cowQuality,
    country,
    preferredTimeSlot,
  });

  // Check total available capacity and count available slots for the day and cow quality
  const checkSlotAvailability = async () => {
    let totalAvailableCapacity = 0;
    let availableSlotCount = 0;
    let availableSlots = [];
    
    for (const timeSlot of TIME_SLOTS) {
      const existingSlot = await Slot.findOne({ timeSlot, day, country });
      if (!existingSlot) {
        totalAvailableCapacity += 7; // New slot can hold 7 shares
        availableSlotCount++;
        availableSlots.push({ timeSlot, capacity: 7 });
      } else if (existingSlot.cowQuality === cowQuality) {
        const currentShares = existingSlot.participants.reduce((sum, p) => sum + p.shares, 0);
        const capacity = 7 - currentShares;
        totalAvailableCapacity += capacity; // Add remaining capacity
        if (capacity > 0) {
          availableSlotCount++;
          availableSlots.push({ timeSlot, capacity });
        }
      }
    }
    
    console.log('[allocateSlot] Total available capacity:', totalAvailableCapacity, 
                'Requested shares:', remainingShares, 
                'Available slot count:', availableSlotCount);
                
    // Check if we need multiple slots but only one is available
    const needsMultipleSlots = remainingShares > 7;
    if (needsMultipleSlots && availableSlotCount < 2) {
      // Not enough slots available to allocate all members
      return {
        hasEnoughCapacity: totalAvailableCapacity >= remainingShares,
        hasEnoughSlots: false,
        message: `You have ${remainingShares} members but only one slot with ${totalAvailableCapacity} spaces is available. Each slot can only accommodate 7 members. Please reduce the number of members or try another day.`
      };
    }
    
    return { 
      hasEnoughCapacity: totalAvailableCapacity >= remainingShares,
      hasEnoughSlots: true,
      availableSlots
    };
  };

  const availability = await checkSlotAvailability();
  if (!availability.hasEnoughCapacity) {
    throw new Error('Not enough capacity for the requested shares. Please reduce the number of shares or try another day or cow quality.');
  }
  
  if (!availability.hasEnoughSlots) {
    throw new Error(availability.message);
  }

  // Helper function to check if a time slot is available for the given cow quality
  const isTimeSlotAvailable = async (timeSlot, targetCowQuality, sharesToAllocate) => {
    const existingSlot = await Slot.findOne({ timeSlot, day, country });
    if (existingSlot) {
      // Check if the slot is assigned to a different cow quality
      if (existingSlot.cowQuality !== targetCowQuality) {
        console.log('[allocateSlot] Time slot unavailable due to different cow quality', {
          timeSlot,
          existingCowQuality: existingSlot.cowQuality,
          targetCowQuality,
        });
        return { available: false, capacity: 0 };
      }
      // Check available capacity
      const totalShares = existingSlot.participants.reduce((sum, p) => sum + p.shares, 0);
      const availableCapacity = 7 - totalShares;
      return { available: availableCapacity >= sharesToAllocate, capacity: availableCapacity };
    }
    // If no slot exists, it's available
    return { available: true, capacity: 7 };
  };

  // Helper function to find or create a slot
  const assignToSlot = async (timeSlot, sharesToAllocate, participantsToAllocate) => {
    let slot = await Slot.findOne({ timeSlot, day, cowQuality, country });
    if (slot) {
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + sharesToAllocate <= 7) {
        console.log('[allocateSlot] Adding to existing slot', { slotId: slot._id, timeSlot });
        slot.participants.push({
          participationId: _id,
          collectorName,
          participantNames: participantsToAllocate,
          shares: sharesToAllocate,
        });
        await slot.save();
        if (!participation.slotId) {
          participation.slotId = slot._id;
          participation.timeSlot = timeSlot;
          participation.slotAssigned = true;
        }
        return slot;
      }
    } else {
      // Check for cow quality conflict
      const availability = await isTimeSlotAvailable(timeSlot, cowQuality, sharesToAllocate);
      if (!availability.available) {
        console.log('[allocateSlot] Skipping slot creation due to cow quality conflict or full capacity', { timeSlot });
        return null;
      }
      console.log('[allocateSlot] Creating new slot', { timeSlot });
      const newSlot = new Slot({
        timeSlot,
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
        participation.timeSlot = timeSlot;
        participation.slotAssigned = true;
      }
      return newSlot;
    }
    return null;
  };

  // Main allocation loop
  while (remainingShares > 0) {
    const sharesToAllocateInitial = Math.min(remainingShares, 7);
    let sharesToAllocate = sharesToAllocateInitial;
    const participantsToAllocate = remainingParticipants.slice(0, sharesToAllocate);
    let allocated = false;

    // If a preferred time slot is provided, try to partially fill it first
    if (preferredTimeSlot && TIME_SLOTS.includes(preferredTimeSlot) && slots.length === 0) {
      const availability = await isTimeSlotAvailable(preferredTimeSlot, cowQuality, sharesToAllocate);
      if (availability.capacity > 0) {
        // Allocate as many shares as possible to the preferred slot
        sharesToAllocate = Math.min(sharesToAllocate, availability.capacity);
        const participantsForPreferred = remainingParticipants.slice(0, sharesToAllocate);
        const slot = await assignToSlot(preferredTimeSlot, sharesToAllocate, participantsForPreferred);
        if (slot) {
          slots.push(slot);
          remainingShares -= sharesToAllocate;
          remainingParticipants = remainingParticipants.slice(sharesToAllocate);
          allocated = true;
          preferredTimeSlot = null; // Clear preferred slot after first use
        }
      } else {
        throw new Error(`Selected time slot ${preferredTimeSlot} is unavailable due to cow quality conflict or full capacity. Please choose another.`);
      }
    }

    // If there are still shares to allocate, prioritize partially filled slots (earlier first)
    if (!allocated && remainingShares > 0) {
      sharesToAllocate = Math.min(remainingShares, 7);
      const participantsToAllocate = remainingParticipants.slice(0, sharesToAllocate);

      // Check for partially filled slots
      const existingSlots = await Slot.find({ day, cowQuality, country }).sort({ timeSlot: 1 });
      for (const slot of existingSlots) {
        const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
        const availableCapacity = 7 - totalShares;
        if (availableCapacity > 0) {
          const sharesForThisSlot = Math.min(sharesToAllocate, availableCapacity);
          const participantsForThisSlot = remainingParticipants.slice(0, sharesForThisSlot);
          console.log('[allocateSlot] Filling existing slot', { slotId: slot._id, timeSlot: slot.timeSlot });
          slot.participants.push({
            participationId: _id,
            collectorName,
            participantNames: participantsForThisSlot,
            shares: sharesForThisSlot,
          });
          await slot.save();
          slots.push(slot);
          remainingShares -= sharesForThisSlot;
          remainingParticipants = remainingParticipants.slice(sharesForThisSlot);
          allocated = true;
          break;
        }
      }
    }

    // If no existing slots have capacity, try creating a new slot in order
    if (!allocated && remainingShares > 0) {
      sharesToAllocate = Math.min(remainingShares, 7);
      const participantsToAllocate = remainingParticipants.slice(0, sharesToAllocate);

      for (const timeSlot of TIME_SLOTS) {
        const availability = await isTimeSlotAvailable(timeSlot, cowQuality, sharesToAllocate);
        if (availability.available) {
          const slot = await assignToSlot(timeSlot, sharesToAllocate, participantsToAllocate);
          if (slot) {
            slots.push(slot);
            remainingShares -= sharesToAllocate;
            remainingParticipants = remainingParticipants.slice(sharesToAllocate);
            allocated = true;
            break;
          }
        }
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
      throw new Error('No available slots for remaining shares. Please try another day or cow quality.');
    }
  }

  await participation.save();
  console.log('[allocateSlot] Allocation completed', { participationId: _id, slots: slots.map(s => s._id) });

  // Emit socket event for updated slots
  const io = require('socket.io-client'); // Adjust based on your setup
  const socket = io();
  slots.forEach((slot) => {
    socket.emit('slotCreated', slot);
  });

  return slots;
}