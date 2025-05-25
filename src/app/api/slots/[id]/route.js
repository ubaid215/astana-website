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

export async function PATCH(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id: slotId } = await params; // Get slotId from dynamic route
    const { participationId, index, newName } = await req.json();

    // Validate input
    if (!slotId || !slotId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
    }
    if (!participationId || !participationId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid participation ID' }, { status: 400 });
    }
    if (typeof index !== 'number' || index < 0) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }
    if (typeof newName !== 'string' || newName.trim() === '') {
      return NextResponse.json({ error: 'Invalid participant name' }, { status: 400 });
    }

    await connectDB();

    // Find the slot
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Find the participation
    const participation = await Participation.findById(participationId);
    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Validate that the participation belongs to the slot
    if (participation.slotId.toString() !== slotId) {
      return NextResponse.json({ error: 'Participation does not belong to this slot' }, { status: 400 });
    }

    // Update participant name
    if (!participation.participantNames || index >= participation.participantNames.length) {
      return NextResponse.json({ error: 'Invalid participant index' }, { status: 400 });
    }
    participation.participantNames[index] = newName.trim();
    await participation.save();

    // Update slot's participant data
    const participantIndex = slot.participants.findIndex(
      (p) => p.participationId.toString() === participationId
    );
    if (participantIndex === -1) {
      return NextResponse.json({ error: 'Participant not found in slot' }, { status: 400 });
    }
    slot.participants[participantIndex].participantNames[index] = newName.trim();
    await slot.save();

    // Emit socket event for real-time update
    const io = getIO();
    if (io) {
      io.to('admin').emit('participantNameUpdated', { slotId, participationId, index, newName: newName.trim() });
    }

    return NextResponse.json({ message: 'Participant name updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Participant name update error:', {
      message: error.message,
      stack: error.stack,
      slotId: params.id,
      participationId,
      index,
    });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}