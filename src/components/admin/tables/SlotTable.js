'use client';

import { useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

export default function SlotTable({ initialSlots, day }) {
  const { socket, connected, slots, setSlots } = useSocket();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const isAdmin = status === 'authenticated' && session?.user?.isAdmin;

  useEffect(() => {
    // Initialize slots with filtered initialSlots
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
          // Sort by timeSlot for consistent display
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

    const handleConnectError = (error) => {
      console.warn('[SlotTable] Socket.IO connection error:', error.message);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time updates. Please refresh the page.',
        variant: 'destructive',
      });
    };

    socket.on('slotCreated', handleSlotCreated);
    socket.on('slotDeleted', handleSlotDeleted);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('slotCreated', handleSlotCreated);
      socket.off('slotDeleted', handleSlotDeleted);
      socket.off('connect_error', handleConnectError);
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

  const filteredSlots = slots.filter((s) => s.day === day).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Day {day} Slots</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time Slot</TableHead>
            <TableHead>Cow Quality</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Collector Name</TableHead>
            <TableHead>Participant Names</TableHead>
            <TableHead>Shares</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSlots.length > 0 ? (
            filteredSlots.map((slot) => (
              <TableRow key={slot._id}>
                <TableCell>{slot.timeSlot}</TableCell>
                <TableCell>{slot.cowQuality}</TableCell>
                <TableCell>{slot.country}</TableCell>
                <TableCell>
                  {slot.participants.map(p => p.collectorName).join(', ')}
                </TableCell>
                <TableCell>
                  {slot.participants.map(p => 
                    p.participantNames && p.participantNames.length > 0 
                      ? p.participantNames.join(', ') 
                      : 'N/A'
                  ).join('; ')}
                </TableCell>
                <TableCell>
                  {slot.participants.reduce((sum, p) => sum + p.shares, 0)}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDeleteSlot(slot._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                No slots assigned for Day {day}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const dynamic = 'force-dynamic';