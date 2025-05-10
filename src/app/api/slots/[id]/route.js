import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import Participation from '@/lib/db/models/Participation';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params; // Await params to resolve the dynamic route parameter

    // Validate slot ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
    }

    // Find and delete the slot
    const slot = await Slot.findByIdAndDelete(id);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Update related participations
    await Participation.updateMany(
      { slotId: id },
      { 
        $unset: { slotId: '', timeSlot: '' },
        slotAssigned: false 
      }
    );

    // Emit socket event for real-time update
    const io = getIO();
    if (io) {
      io.to('admin').emit('slotDeleted', { slotId: id });
    }

    return NextResponse.json({ message: 'Slot deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Slot deletion error:', {
      message: error.message,
      stack: error.stack,
      slotId: params.id,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}