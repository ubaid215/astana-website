import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { getIO } from '@/lib/socket';
import { emitSocketEvent } from '@/lib/emitSocketEvent';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// PATCH handler for updating participations
export async function PATCH(req, context) {
  try {
    // 1. Extract parameters and check authorization
    const { id } = await context.params;
    console.log('[API] PATCH /api/participation/[id] called with id:', id);
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const updates = await req.json();
    console.log('[API] Update data received:', updates);

    // 3. Validate updates
    const allowedUpdates = ['collectorName', 'members'];
    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      console.warn('[API] Invalid update fields:', updateKeys);
      return NextResponse.json({ error: 'Invalid update fields' }, { status: 400 });
    }

    // 4. Additional validation
    if (updates.collectorName !== undefined) {
      if (typeof updates.collectorName !== 'string' || updates.collectorName.trim().length === 0) {
        return NextResponse.json({ error: 'Collector name must be a non-empty string' }, { status: 400 });
      }
      updates.collectorName = updates.collectorName.trim();
    }

    if (updates.members !== undefined) {
      if (!Array.isArray(updates.members)) {
        return NextResponse.json({ error: 'Members must be an array' }, { status: 400 });
      }
      updates.members = updates.members
        .map(member => typeof member === 'string' ? member.trim() : '')
        .filter(member => member.length > 0);
      
      if (updates.members.length === 0) {
        return NextResponse.json({ error: 'At least one member name is required' }, { status: 400 });
      }
    }

    // 5. Connect to database and update participation
    await connectDB();
    
    const updatedParticipation = await Participation.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      {
        path: 'userId',
        select: 'name email'
      },
      {
        path: 'slotId',
        select: 'timeSlot day'
      }
    ]);

    if (!updatedParticipation) {
      console.warn('[API] Participation not found for id:', id);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    console.log('[API] Participation updated successfully:', updatedParticipation._id);

    // 6. Update associated slot if exists
    if (updatedParticipation.slotId) {
      const slot = await Slot.findById(updatedParticipation.slotId);
      if (slot) {
        const participantIndex = slot.participants.findIndex(p => p.participationId.toString() === id);
        if (participantIndex !== -1) {
          slot.participants[participantIndex].collectorName = updatedParticipation.collectorName;
          slot.participants[participantIndex].participantNames = updatedParticipation.members || [];
          await slot.save();

          // Emit slotUpdated event
          try {
            const emitted = emitSocketEvent('slotUpdated', slot, ['admin', 'public']);
            if (emitted) {
              console.log('[API] Successfully emitted slotUpdated for slot:', slot._id);
            } else {
              const io = getIO();
              if (io) {
                io.to('admin').emit('slotUpdated', slot);
                io.to('public').emit('slotUpdated', slot);
                console.log('[API] Emitted slotUpdated via direct call for slot:', slot._id);
              } else {
                console.warn('[API] Socket.io not initialized, skipping slotUpdated emission');
              }
            }
          } catch (slotError) {
            console.warn('[API] Socket.io slotUpdated emission error:', slotError.message);
          }
        }
      }
    }

    // 7. Emit socket event for participation update
    try {
      const emitted = emitSocketEvent('participationUpdated', updatedParticipation, ['admin', 'public']);
      
      if (emitted) {
        console.log('[API] Successfully emitted participationUpdated for:', id);
      } else {
        const io = getIO();
        if (io) {
          io.to('admin').emit('participationUpdated', updatedParticipation);
          io.to('public').emit('participationUpdated', updatedParticipation);
          console.log('[API] Emitted participationUpdated via direct call for:', id);
        } else {
          console.warn('[API] Socket.io not initialized, skipping participationUpdated emission');
        }
      }
    } catch (socketError) {
      console.warn('[API] Socket.io participationUpdated emission error:', socketError.message);
    }

    // 8. Return updated participation
    return NextResponse.json(updatedParticipation);

  } catch (error) {
    console.error('[API] PATCH Participation Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE handler (unchanged)
export async function DELETE(req, context) {
  try {
    const { id } = await context.params;
    console.log('[API] DELETE /api/participation/[id] called with id:', id);
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub || !token?.isAdmin) {
      console.warn('[API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const participation = await Participation.findById(id);
    if (!participation) {
      console.warn('[API] Participation not found for id:', id);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    // Handle slot cleanup
    if (participation.slotId) {
      const slot = await Slot.findById(participation.slotId);
      if (slot) {
        // Remove the participation from the slot's participants
        const participantIndex = slot.participants.findIndex(p => p.participationId.toString() === id);
        if (participantIndex !== -1) {
          slot.participants.splice(participantIndex, 1);

          // If no participants remain, delete the slot
          if (slot.participants.length === 0) {
            await Slot.findByIdAndDelete(participation.slotId);
            console.log('[API] Deleted empty slot:', participation.slotId);
            try {
              const emitted = emitSocketEvent('slotDeleted', { slotId: participation.slotId });
              if (emitted) {
                console.log('[API] Successfully emitted slotDeleted for:', participation.slotId);
              } else {
                const io = getIO();
                if (io) {
                  io.to('admin').emit('slotDeleted', { slotId: participation.slotId });
                  console.log('[API] Emitted slotDeleted via direct call for:', participation.slotId);
                }
              }
            } catch (slotError) {
              console.warn('[API] Failed to emit slotDeleted:', slotError.message);
            }
          } else {
            // Save the updated slot if participants remain
            await slot.save();
            try {
              const emitted = emitSocketEvent('slotUpdated', slot);
              if (emitted) {
                console.log('[API] Successfully emitted slotUpdated for:', slot._id);
              } else {
                const io = getIO();
                if (io) {
                  io.to('admin').emit('slotUpdated', slot);
                  console.log('[API] Emitted slotUpdated via direct call for:', slot._id);
                }
              }
            } catch (slotError) {
              console.warn('[API] Failed to emit slotUpdated:', slotError.message);
            }
          }
        }
      }
    }

    // Delete the participation
    await Participation.deleteOne({ _id: id });

    // Emit participation deleted event
    const emitted = emitSocketEvent('participationDeleted', id, ['admin', 'public']);
    if (emitted) {
      console.log('[API] Successfully emitted participationDeleted for:', id);
    } else {
      try {
        const io = getIO();
        if (io) {
          io.to('admin').emit('participationDeleted', id);
          io.to('public').emit('participationDeleted', id);
          console.log('[API] Emitted participationDeleted via direct call for:', id);
        } else {
          console.warn('[API] Socket.io not initialized, skipping participationDeleted emission');
        }
      } catch (socketError) {
        console.warn('[API] Socket.io emission error:', socketError.message);
      }
    }

    return NextResponse.json(
      { message: 'Participation deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] DELETE Participation Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}