import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import User from '@/lib/db/models/User';
import Participation from '@/lib/db/models/Participation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIO } from '@/lib/socket';

export async function PATCH(req) {
  try {
    console.log('[Slots/Complete] Received PATCH request at', new Date().toISOString());

    // Authenticate admin user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[Slots/Complete] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { slotId, completed } = await req.json();
    if (!slotId || typeof completed !== 'boolean') {
      console.error('[Slots/Complete] Invalid input:', { slotId, completed });
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();
    console.log('[Slots/Complete] MongoDB connected');

    // Find the slot with participants
    const slot = await Slot.findById(slotId);
    if (!slot) {
      console.error('[Slots/Complete] Slot not found:', slotId);
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Only process if the completion status is changing
    // In your PATCH handler, modify the completion logic:
    if (completed && !slot.completed) {
      console.log('[Slots/Complete] Processing completion for slot:', slotId);

      // Get all participations for this slot
      const participations = await Participation.find({ slotId: slot._id });

      // Create completion entry
      const completionEntry = {
        slotId: slot._id,
        day: slot.day,
        timeSlot: slot.timeSlot,
        cowQuality: slot.cowQuality,
        message: 'Your Qurbani has been completed successfully!',
        completedAt: new Date(),
      };

      // Update each participating user
      for (const participation of participations) {
        const user = await User.findById(participation.userId);
        if (!user) continue;

        // Initialize if not exists
        if (!user.qurbaniCompletions) {
          user.qurbaniCompletions = [];
        }

        // Check for existing completion
        const hasCompletion = user.qurbaniCompletions.some(
          c => c.slotId.toString() === slotId.toString()
        );

        if (!hasCompletion) {
          // Add collector/participant info specific to this user
          const userCompletion = {
            ...completionEntry,
            collectorName: participation.collectorName,
            participantNames: participation.members || [],
          };

          user.qurbaniCompletions.push(userCompletion);
          await user.save();

          // Emit socket event
          const io = getIO();
          io.to(user._id.toString()).emit('qurbaniCompleted', {
            userId: user._id.toString(),
            completion: userCompletion,
          });
        }
      }
    }

    // Update slot completion status
    const updatedSlot = await Slot.findByIdAndUpdate(
      slotId,
      { completed },
      { new: true }
    );

    // Emit event to admin dashboard
    const io = getIO();
    io.to('admin').emit('slotCompleted', {
      slotId: updatedSlot._id,
      completed: updatedSlot.completed,
      day: updatedSlot.day
    });

    return NextResponse.json({
      message: 'Slot completion updated successfully',
      slot: updatedSlot
    }, { status: 200 });

  } catch (error) {
    console.error('[Slots/Complete] Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({
      error: error.message || 'Server error'
    }, { status: 500 });
  }
}