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
    setSlots(initialSlots || []);
  }, [initialSlots, setSlots]);

  useEffect(() => {
    if (!socket || !connected) {
      console.warn('[SlotTable] Socket not connected, skipping event listeners');
      return;
    }

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

    socket.on('slotDeleted', handleSlotDeleted);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('slotDeleted', handleSlotDeleted);
      socket.off('connect_error', handleConnectError);
      console.log('[SlotTable] Cleaned up socket event listeners');
    };
  }, [socket, connected, setSlots, toast]);

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

  const filteredSlots = slots.filter((s) => s.day === day);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Day {day} Slots</h2>
      {filteredSlots.length > 0 ? (
        filteredSlots.map((slot, index) => (
          <div key={slot._id} className="mb-8 break-after-page">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-secondary">
                Slot {index + 1}: {slot.timeSlot} - {slot.cowQuality} ({slot.country})
              </h3>
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDeleteSlot(slot._id)}
                >
                  Delete Slot
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collector Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Shares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slot.participants.map((p) => (
                  <TableRow key={p.participationId}>
                    <TableCell>{p.collectorName}</TableCell>
                    <TableCell>{p.members.join(', ')}</TableCell>
                    <TableCell>{p.shares}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No slots assigned for Day {day}</p>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';