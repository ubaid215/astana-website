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

    // Identify time slots that are available for the selected cow quality
    const availableSlots = TIME_SLOTS[day].filter((timeSlot) => {
      const slot = slots.find((s) => s.timeSlot === timeSlot);
      if (!slot) {
        // Slot is unoccupied and available
        return true;
      }
      // Slot is available if it matches the cow quality and has remaining capacity
      const totalShares = slot.participants.reduce((sum, p) => sum + p.shares, 0);
      return slot.cowQuality === cowQuality && totalShares < 7;
    });

    return NextResponse.json({ availableSlots }, { status: 200 });
  } catch (error) {
    console.error('[Available Slots API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}