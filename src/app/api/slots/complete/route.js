import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIO } from '@/lib/socket';

export async function PATCH(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { slotId, completed } = await req.json();
    if (!slotId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();
    console.log('[Slots/Complete] Attempting to update slot:', { slotId, completed });

    const slot = await Slot.findByIdAndUpdate(
      slotId,
      { completed },
      { new: true }
    );

    if (!slot) {
      console.error('[Slots/Complete] Slot not found:', slotId);
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    console.log('[Slots/Complete] Slot updated successfully:', { slotId, completed: slot.completed });

    // Find participations linked to this slot
    const participations = await Participation.find({ slotId }).select('userId collectorName');
    
    // Get collector names from the slot's participants
    const slotCollectorNames = slot.participants.map(p => p.collectorName);

    // Find user IDs where the collectorName matches
    const userIdsToNotify = participations
      .filter(p => slotCollectorNames.includes(p.collectorName))
      .map(p => p.userId.toString());

    console.log('[Slots/Complete] Notifying users:', { userIds: userIdsToNotify, slotCollectorNames });

    // Emit Socket.IO event to notify users and admins
    const io = getIO();
    userIdsToNotify.forEach((userId) => {
      io.to(userId).emit('slotCompleted', { slotId, completed, userId });
    });
    io.to('admin').emit('slotCompleted', { slotId, completed, day: slot.day });

    return NextResponse.json({ message: 'Slot completion updated', slot }, { status: 200 });
  } catch (error) {
    console.error('Slot completion error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}