import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { TIME_SLOTS } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const { day, cowQuality, shares = 1 } = await req.json();

    if (!day || !cowQuality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find all slots for the given day
    const slots = await Slot.find({ day });

    // Get detailed availability info
    const availability = TIME_SLOTS[day].map((timeSlot) => {
      const slot = slots.find((s) => s.timeSlot === timeSlot);
      if (!slot) {
        return {
          timeSlot,
          available: true,
          capacity: 7,
          canAccommodate: shares <= 7,
          cowQuality: null
        };
      }
      
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      const availableCapacity = 7 - totalShares;
      
      return {
        timeSlot,
        available: slot.cowQuality === cowQuality && availableCapacity > 0,
        capacity: availableCapacity,
        canAccommodate: shares <= availableCapacity,
        cowQuality: slot.cowQuality
      };
    });

    // Filter available slots that match our cow quality
    const availableSlots = availability
      .filter(slot => slot.available)
      .map(slot => slot.timeSlot)
      .sort(); // Sort by time for earliest slot first

    // Calculate total available capacity
    const totalAvailableCapacity = availability
      .filter(slot => slot.available)
      .reduce((sum, slot) => sum + slot.capacity, 0);

    // Check if we can accommodate all requested shares
    const canAccommodate = shares <= totalAvailableCapacity;
    const needsMultipleSlots = shares > 7;
    const availableSlotCount = availableSlots.length;

    return NextResponse.json({ 
      availableSlots,
      totalAvailableCapacity,
      canAccommodate,
      needsMultipleSlots,
      availableSlotCount,
      minimumRequiredSlots: Math.ceil(shares / 7),
      detailedAvailability: availability
    }, { status: 200 });
  } catch (error) {
    console.error('[Available Slots API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}