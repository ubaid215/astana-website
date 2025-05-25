import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import ShareLimit from '@/lib/db/models/ShareLimit';
import { TIME_SLOTS } from '@/lib/utils';
import mongoose from 'mongoose';

export async function allocateSlot(participation, session) {
  await connectDB();

  if (participation.paymentStatus !== 'Completed') {
    console.log('[allocateSlot] Skipping slot allocation: paymentStatus is not Completed', {
      participationId: participation._id,
      paymentStatus: participation.paymentStatus,
    });
    return [];
  }

  try {
    const shareLimit = await ShareLimit.findOne().session(session);
    if (!shareLimit) {
      throw new Error('Share limits not configured');
    }

    const cowQualityLower = participation.cowQuality.toLowerCase();
    const maxShares = shareLimit[cowQualityLower] ?? 7;
    const participatedShares = shareLimit.participatedShares[cowQualityLower] ?? 0;
    const remainingShares = shareLimit.remainingShares[cowQualityLower] ?? maxShares;

    if (remainingShares <= 0) {
      throw new Error(`This cow quality (${participation.cowQuality}) has closed`);
    }
    if (participation.shares > remainingShares) {
      throw new Error(`Only ${remainingShares} shares remaining for ${participation.cowQuality} quality`);
    }

    const slots = [];
    let remainingSharesToAllocate = participation.shares;
    let remainingParticipants = [...(participation.members || [])];
    const { day, cowQuality, collectorName, _id } = participation;
    let preferredTimeSlot = participation.timeSlot || TIME_SLOTS[day || '1'][0];

    console.log('[allocateSlot] Starting allocation', {
      participationId: _id,
      shares: remainingSharesToAllocate,
      participantNames: remainingParticipants,
      day,
      cowQuality,
      preferredTimeSlot,
      remainingShares,
    });

    const checkSlotAvailability = async () => {
      let totalAvailableCapacity = 0;
      let availableSlotCount = 0;
      let availableSlots = [];

      for (const timeSlot of TIME_SLOTS[day]) {
        const existingSlot = await Slot.findOne({ timeSlot, day }).session(session);
        let capacity;
        if (!existingSlot) {
          capacity = Math.min(7, remainingShares);
          totalAvailableCapacity += capacity;
          availableSlotCount++;
          availableSlots.push({ timeSlot, capacity });
        } else if (existingSlot.cowQuality.toLowerCase() === cowQualityLower) {
          const currentShares = existingSlot.participants.reduce((sum, p) => sum + p.shares, 0);
          capacity = Math.min(7 - currentShares, remainingShares);
          totalAvailableCapacity += capacity;
          if (capacity > 0) {
            availableSlotCount++;
            availableSlots.push({ timeSlot, capacity });
          }
        }
      }

      const minimumRequiredSlots = Math.ceil(remainingSharesToAllocate / 7);

      if (totalAvailableCapacity < remainingSharesToAllocate) {
        return {
          success: false,
          message: `Not enough capacity for ${remainingSharesToAllocate} shares. Only ${totalAvailableCapacity} shares available.`,
          totalAvailableCapacity,
          availableSlotCount,
        };
      }

      if (remainingSharesToAllocate > 7 && availableSlotCount < minimumRequiredSlots) {
        return {
          success: false,
          message: `Need ${minimumRequiredSlots} slots for ${remainingSharesToAllocate} shares, but only ${availableSlotCount} slots with ${totalAvailableCapacity} capacity available.`,
          totalAvailableCapacity,
          availableSlotCount,
          minimumRequiredSlots,
        };
      }

      return {
        success: true,
        totalAvailableCapacity,
        availableSlotCount,
        availableSlots,
      };
    };

    const availability = await checkSlotAvailability();
    if (!availability.success) {
      console.error('[allocateSlot] Availability check failed:', availability.message);
      throw new Error(availability.message);
    }

    let sortedAvailableSlots = availability.availableSlots.sort((a, b) => {
      if (a.timeSlot === preferredTimeSlot) return -1;
      if (b.timeSlot === preferredTimeSlot) return 1;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    for (const { timeSlot, capacity } of sortedAvailableSlots) {
      if (remainingSharesToAllocate <= 0) break;

      const sharesToAllocate = Math.min(remainingSharesToAllocate, capacity);
      const participantNamesForSlot = remainingParticipants.slice(0, sharesToAllocate);
      remainingParticipants = remainingParticipants.slice(sharesToAllocate);
      remainingSharesToAllocate -= sharesToAllocate;

      let slot = await Slot.findOne({ timeSlot, day }).session(session);
      const participantData = {
        participationId: _id,
        collectorName,
        participantNames: participantNamesForSlot,
        shares: sharesToAllocate,
      };

      if (!slot) {
        slot = new Slot({
          timeSlot,
          day,
          cowQuality,
          participants: [participantData],
        });
      } else {
        slot.participants.push(participantData);
      }

      await slot.save({ session });
      slots.push(slot);

      console.log('[allocateSlot] Allocated slot', {
        slotId: slot._id,
        timeSlot,
        shares: sharesToAllocate,
        participantNames: participantNamesForSlot,
      });

      if (slots.length === 1) {
        participation.slotId = slot._id;
        participation.timeSlot = slot.timeSlot;
        participation.slotAssigned = true;
      }
    }

    if (remainingSharesToAllocate > 0) {
      console.error('[allocateSlot] Failed to allocate all shares', {
        participationId: _id,
        remainingShares: remainingSharesToAllocate,
      });
      throw new Error(`Failed to allocate ${remainingSharesToAllocate} remaining shares`);
    }

    await participation.save({ session });

    console.log('[allocateSlot] Allocation completed', {
      participationId: _id,
      slots: slots.map(s => s._id),
    });

    return slots;
  } catch (error) {
    throw error;
  }
}