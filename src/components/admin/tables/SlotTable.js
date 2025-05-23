'use client';

import { useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Checkbox } from '@/components/ui/Checkbox';

export default function SlotTable({ initialSlots, day }) {
  const { socket, connected, slots, setSlots } = useSocket();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const isAdmin = status === 'authenticated' && session?.user?.isAdmin;

  useEffect(() => {
    const filteredInitial = initialSlots.filter(s => s.day === day);
    setSlots(filteredInitial);
    console.log('[SlotTable] Initialized slots for Day', day, filteredInitial);
  }, [initialSlots, day, setSlots]);

  useEffect(() => {
    if (!socket || !connected) {
      console.warn('[SlotTable] Socket not connected, skipping event listeners');
      return;
    }

    const handleSlotCreated = (newSlot) => {
      console.log('[SlotTable] Slot created:', newSlot);
      if (newSlot.day === day) {
        setSlots((prevSlots) => {
          const updatedSlots = [...prevSlots, newSlot];
          return updatedSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        toast({
          title: 'Slot Created',
          description: `New slot added for ${newSlot.timeSlot} (${newSlot.cowQuality})`,
          variant: 'success',
        });
      }
    };

    const handleSlotDeleted = ({ slotId }) => {
      console.log('[SlotTable] Slot deleted:', slotId);
      setSlots((prevSlots) => prevSlots.filter((slot) => slot._id !== slotId));
      toast({
        title: 'Slot Deleted',
        description: 'The slot was successfully removed.',
        variant: 'success',
      });
    };

    const handleSlotUpdated = (updatedSlot) => {
      console.log('[SlotTable] Slot updated:', updatedSlot);
      if (updatedSlot.day === day) {
        setSlots((prevSlots) => {
          const updatedSlots = prevSlots.filter((slot) => slot._id !== updatedSlot._id);
          updatedSlots.push(updatedSlot);
          return updatedSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        toast({
          title: 'Slot Updated',
          description: `Slot ${updatedSlot.timeSlot} updated`,
          variant: 'success',
        });
      }
    };

    const handleSlotCompleted = ({ slotId, completed, day: slotDay }) => {
      console.log('[SlotTable] Slot completed event received:', { slotId, completed, slotDay });
      if (slotDay !== day) {
        console.log('[SlotTable] Ignoring slotCompleted event for different day:', { slotDay, currentDay: day });
        return;
      }
      setSlots((prevSlots) => {
        const slotExists = prevSlots.some(slot => slot._id === slotId);
        if (!slotExists) {
          console.warn('[SlotTable] Slot not found in state:', slotId);
          return prevSlots;
        }
        const updatedSlots = prevSlots.map((slot) =>
          slot._id === slotId ? { ...slot, completed } : slot
        );
        console.log('[SlotTable] Updated slots:', updatedSlots);
        return updatedSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
      });
      toast({
        title: 'Slot Completion Updated',
        description: `Slot ${slotId} marked as ${completed ? 'completed' : 'incomplete'}`,
        variant: 'success',
      });
    };

    socket.on('slotCreated', handleSlotCreated);
    socket.on('slotDeleted', handleSlotDeleted);
    socket.on('slotUpdated', handleSlotUpdated);
    socket.on('slotCompleted', handleSlotCompleted);
    socket.on('connect_error', (error) => {
      console.warn('[SlotTable] Socket.IO connection error:', error.message);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time updates. Please refresh the page.',
        variant: 'destructive',
      });
    });

    return () => {
      socket.off('slotCreated', handleSlotCreated);
      socket.off('slotDeleted', handleSlotDeleted);
      socket.off('slotUpdated', handleSlotUpdated);
      socket.off('slotCompleted', handleSlotCompleted);
      socket.off('connect_error');
      console.log('[SlotTable] Cleaned up socket event listeners');
    };
  }, [socket, connected, setSlots, toast, day]);

  const handleDeleteSlot = useCallback(
    async (slotId) => {
      try {
        if (status !== 'authenticated' || !session?.user?.id) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`/api/slots/${slotId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete slot');
        }

        toast({
          title: 'Success',
          description: 'Slot deleted successfully',
          variant: 'success',
        });
      } catch (error) {
        console.error('Error deleting slot:', error.message);
        toast({
          title: 'Error',
          description: `Failed to delete slot: ${error.message}`,
          variant: 'destructive',
        });
      }
    },
    [toast, session, status]
  );

  const confirmDeleteSlot = useCallback(
    (slotId) => {
      if (window.confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
        handleDeleteSlot(slotId);
      }
    },
    [handleDeleteSlot]
  );

  const handleShuffleParticipant = useCallback(
    async (slotId, participationId) => {
      try {
        if (status !== 'authenticated' || !session?.user?.id) {
          throw new Error('Authentication required');
        }

        const targetDay = day === 1 ? 2 : 1;
        const response = await fetch('/api/slots/shuffle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slotId, participationId, targetDay }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to shuffle participant');
        }

        const { message } = await response.json();
        toast({
          title: 'Success',
          description: message,
          variant: 'success',
        });
      } catch (error) {
        console.error('Error shuffling participant:', error.message);
        toast({
          title: 'Error',
          description: `Failed to shuffle participant: ${error.message}`,
          variant: 'destructive',
        });
      }
    },
    [toast, session, status, day]
  );

  const confirmShuffleParticipant = useCallback(
    (slotId, participationId, collectorName) => {
      const targetDay = day === 1 ? 2 : 1;
      if (
        window.confirm(
          `Are you sure you want to move ${collectorName} to Day ${targetDay}?`
        )
      ) {
        handleShuffleParticipant(slotId, participationId);
      }
    },
    [handleShuffleParticipant, day]
  );

  const handleCompleteSlot = useCallback(
    async (slotId, completed) => {
      try {
        if (status !== 'authenticated' || !session?.user?.isAdmin) {
          throw new Error('Admin access required');
        }

        const response = await fetch('/api/slots/complete', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slotId, completed }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update slot completion');
        }

        toast({
          title: 'Success',
          description: `Slot marked as ${completed ? 'completed' : 'incomplete'}`,
          variant: 'success',
        });
      } catch (error) {
        console.error('Error updating slot completion:', error.message);
        toast({
          title: 'Error',
          description: `Failed to update slot: ${error.message}`,
          variant: 'destructive',
        });
      }
    },
    [toast, session, status]
  );

  const filteredSlots = slots
    .filter((s) => s.day === day)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Day {day} Slots</h2>
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Time Slot</TableHead>
              <TableHead className="w-28">Cow Quality</TableHead>
              <TableHead className="w-40">Collector Name</TableHead>
              <TableHead className="w-64">Participant Names</TableHead>
              <TableHead className="w-20">Shares</TableHead>
              {isAdmin && <TableHead className="w-24">Complete</TableHead>}
              {isAdmin && <TableHead className="w-64">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSlots.length > 0 ? (
              filteredSlots.map((slot) => {
                console.log('[SlotTable] Rendering slot:', { id: slot._id, completed: slot.completed });
                return slot.participants.map((participant) => (
                  <TableRow key={`${slot._id}-${participant.participationId}-${slot.completed}`}>
                    <TableCell>{slot.timeSlot}</TableCell>
                    <TableCell>{slot.cowQuality}</TableCell>
                    <TableCell className="whitespace-normal break-words">{participant.collectorName}</TableCell>
                    <TableCell className="whitespace-normal break-words max-w-xs">
                      {participant.participantNames && participant.participantNames.length > 0
                        ? participant.participantNames.map((name, index) => (
                            <div key={index} className="flex items-baseline">
                              <span className="text-xs text-gray-500 mr-2">{index + 1}.</span>
                              <span>{name}</span>
                            </div>
                          ))
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{participant.shares}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={slot.completed || false}
                          onCheckedChange={(checked) => handleCompleteSlot(slot._id, checked)}
                        />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            confirmShuffleParticipant(
                              slot._id,
                              participant.participationId,
                              participant.collectorName
                            )
                          }
                        >
                          Shuffle to Day {day === 1 ? 2 : 1}
                        </Button>
                        {slot.participants.length === 1 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDeleteSlot(slot._id)}
                          >
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ));
              })
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-8">
                  No slots assigned for Day {day}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}