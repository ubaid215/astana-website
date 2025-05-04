import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { getIO } from '@/lib/socket';
import { allocateSlot } from '@/lib/slotAllocation';

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // Validate time slot availability
    if (data.timeSlot) {
      const existing = await Participation.find({
        timeSlot: data.timeSlot,
        day: data.day,
        cowQuality: data.cowQuality,
        slotAssigned: true,
      });
      const totalShares = existing.reduce((sum, p) => sum + p.shares, 0);
      if (totalShares + data.shares > 7) {
        return new Response(JSON.stringify({ error: 'Selected time slot is full' }), { status: 400 });
      }
    }

    const participation = new Participation(data);
    await participation.save();

    // Allocate slot
    const slot = await allocateSlot(participation);

    // Emit Socket.io events
    const io = getIO();
    io.to('admin').emit('newParticipation', participation);
    io.to('admin').emit('updateSlot', slot);

    return new Response(JSON.stringify({ participationId: participation._id }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), { status: 500 });
  }
}