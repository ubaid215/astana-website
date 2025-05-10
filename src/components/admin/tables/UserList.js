'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';

export default function UserList({ initialParticipations, currentPage, totalPages, setCurrentPage }) {
  const { socket, connected, participations, setParticipations, reconnect } = useSocket();
  const [localParticipations, setLocalParticipations] = useState(initialParticipations);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (socket) {
      console.log('[UserList] Socket connection status:', connected ? 'Connected' : 'Disconnected');
    }
  }, [socket, connected]);

  // Notify user if socket remains disconnected
  useEffect(() => {
    let timeout;
    if (socket && !connected) {
      timeout = setTimeout(() => {
        toast({
          title: 'Socket Disconnected',
          description: 'Real-time updates are unavailable. Click "Reconnect" to try again.',
          variant: 'destructive',
        });
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [socket, connected, toast]);

  useEffect(() => {
    if (participations && participations.length > 0) {
      console.log('[UserList] Updating from socket participations:', participations.length);
      setLocalParticipations(participations);
    } else if (initialParticipations && initialParticipations.length > 0) {
      console.log('[UserList] Using initial participations:', initialParticipations.length);
      setLocalParticipations(initialParticipations);
      if (setParticipations && (!participations || participations.length === 0)) {
        console.log('[UserList] Updating socket state with initial data');
        setParticipations(initialParticipations);
      }
    }
  }, [participations, initialParticipations, setParticipations]);

  useEffect(() => {
    if (!socket) return;
    
    const handleParticipationDeleted = (deletedId) => {
      console.log('[UserList] Received participationDeleted event:', deletedId);
      setLocalParticipations((prev) => prev.filter((p) => p._id !== deletedId));
      toast({
        title: 'Participation Deleted',
        description: 'A participation was deleted by an admin.',
        variant: 'info',
      });
    };
    
    const handleParticipationCreated = (newParticipation) => {
      console.log('[UserList] Received participationCreated event:', newParticipation._id);
      setLocalParticipations((prev) => [...prev, newParticipation]);
      toast({
        title: 'New Participation',
        description: 'A new participation was added.',
        variant: 'info',
      });
    };
    
    const handleParticipationUpdated = (updatedParticipation) => {
      console.log('[UserList] Received participationUpdated event:', updatedParticipation._id);
      setLocalParticipations((prev) =>
        prev.map((p) => (p._id === updatedParticipation._id ? updatedParticipation : p))
      );
    };
    
    socket.on('participationDeleted', handleParticipationDeleted);
    socket.on('participationCreated', handleParticipationCreated);
    socket.on('participationUpdated', handleParticipationUpdated);
    
    return () => {
      socket.off('participationDeleted', handleParticipationDeleted);
      socket.off('participationCreated', handleParticipationCreated);
      socket.off('participationUpdated', handleParticipationUpdated);
    };
  }, [socket, toast]);

  const handleDelete = async (id) => {
    if (status !== 'authenticated') {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        variant: 'destructive',
      });
      return;
    }

    if (!session?.user?.isAdmin) {
      toast({
        title: 'Error',
        description: 'Only admins can delete participations',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this participation?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/participation/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete participation');
      }

      setLocalParticipations((prev) => prev.filter((p) => p._id !== id));
      toast({
        title: 'Success',
        description: 'Participation deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('[UserList] Delete participation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete participation',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (status !== 'authenticated') {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        variant: 'destructive',
      });
      return;
    }

    if (!session?.user?.isAdmin) {
      toast({
        title: 'Error',
        description: 'Only admins can delete all participations',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete ALL participations? This action cannot be undone.')) return;

    setIsDeletingAll(true);
    try {
      const response = await fetch('/api/participation', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete all participations');
      }

      setParticipations([]);
      setLocalParticipations([]);
      setCurrentPage(1);
      toast({
        title: 'Success',
        description: 'All participations deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('[UserList] Delete all participations error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete all participations',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const connectionStatus = socket ? 
    (connected ? 
      <span className="text-xs text-green-500 ml-2">● Live</span> : 
      <span className="text-xs text-red-500 ml-2">● Offline</span>
    ) : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-secondary flex items-center">
          Recent Participations
          {connectionStatus}
        </h2>
        <div className="flex items-center space-x-2">
          {!connected && socket && (
            <Button
              onClick={reconnect}
              className="bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
            >
              Reconnect
            </Button>
          )}
          {localParticipations.length > 0 && (
            <Button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={status !== 'authenticated' || !session?.user.isAdmin || isDeletingAll}
            >
              {isDeletingAll ? 'Deleting...' : 'Delete All Participations'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Collector Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Cow Quality</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Slot Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localParticipations.length > 0 ? (
              localParticipations.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    {p.userId?.name} ({p.userId?.email})
                  </TableCell>
                  <TableCell>{p.collectorName}</TableCell>
                  <TableCell>
                    {Array.isArray(p.members) && p.members.length > 0 ? p.members.join(', ') : 'N/A'}
                  </TableCell>
                  <TableCell>{p.cowQuality}</TableCell>
                  <TableCell>Day {p.day}</TableCell>
                  <TableCell>{p.slotId?.timeSlot || 'Not Assigned'}</TableCell>
                  <TableCell>{p.shares}</TableCell>
                  <TableCell>{p.totalAmount?.toLocaleString() || '0'}</TableCell>
                  <TableCell>{p.paymentStatus}</TableCell>
                  <TableCell>{p.slotAssigned ? 'Assigned' : 'Not Assigned'}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                      size="sm"
                      disabled={status !== 'authenticated' || !session?.user.isAdmin || isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  No participations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="bg-primary text-white"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="bg-primary text-white"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}