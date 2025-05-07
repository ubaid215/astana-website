import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    const participation = await Participation.findById(id);
    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Remove participation from associated slot
    if (participation.slotId) {
      await Slot.updateOne(
        { _id: participation.slotId },
        { $pull: { participants: { participationId: id } } }
      );
    }

    // Delete the participation
    await Participation.deleteOne({ _id: id });

    const io = getIO();
    if (io) {
      io.to('admin').emit('participationDeleted', id);
    } else {
      console.warn('[API] Socket.io not available, skipping events');
    }

    return NextResponse.json({ message: 'Participation deleted' }, { status: 200 });
  } catch (error) {
    console.error('[API] Delete participation error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}