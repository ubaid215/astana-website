import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { TIME_SLOTS } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const { day, cowQuality, country } = await req.json();

    if (!day || !cowQuality || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find all slots for the given day and country
    const slots = await Slot.find({ day, country });

    // Identify time slots that are occupied (either fully or by a different cow quality)
    const occupiedSlots = slots.reduce((acc, slot) => {
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      // If the slot has any participants, check cow quality
      if (slot.cowQuality !== cowQuality || totalShares >= 7) {
        acc.add(slot.timeSlot);
      }
      return acc;
    }, new Set());

    // Filter out occupied slots
    const availableSlots = TIME_SLOTS.filter((timeSlot) => !occupiedSlots.has(timeSlot));

    return NextResponse.json({ availableSlots }, { status: 200 });
  } catch (error) {
    console.error('[Available Slots API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}