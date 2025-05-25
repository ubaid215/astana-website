'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react';

export default function UserList({ initialParticipations, currentPage, totalPages, setCurrentPage }) {
  const { socket, connected, participations, setParticipations, reconnect } = useSocket();
  const [localParticipations, setLocalParticipations] = useState(initialParticipations);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [editingStates, setEditingStates] = useState({});
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState({});
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

  const startEditing = (participationId, field, currentValue, memberIndex = null) => {
    const key = memberIndex !== null ? `${participationId}-${field}-${memberIndex}` : `${participationId}-${field}`;
    setEditingStates(prev => ({ ...prev, [key]: true }));
    setEditValues(prev => ({ ...prev, [key]: currentValue || '' }));
  };

  const cancelEditing = (participationId, field, memberIndex = null) => {
    const key = memberIndex !== null ? `${participationId}-${field}-${memberIndex}` : `${participationId}-${field}`;
    setEditingStates(prev => ({ ...prev, [key]: false }));
    setEditValues(prev => ({ ...prev, [key]: '' }));
  };

  const saveEdit = async (participationId, field, memberIndex = null) => {
    const key = memberIndex !== null ? `${participationId}-${field}-${memberIndex}` : `${participationId}-${field}`;
    const newValue = editValues[key]?.trim();
    
    if (!newValue) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setSaving(prev => ({ ...prev, [key]: true }));

    try {
      const participation = localParticipations.find(p => p._id === participationId);
      let updateData = {};

      if (field === 'collectorName') {
        updateData.collectorName = newValue;
      } else if (field === 'members' && memberIndex !== null) {
        const updatedMembers = [...(participation.members || [])];
        updatedMembers[memberIndex] = newValue;
        updateData.members = updatedMembers;
      }

      const response = await fetch(`/api/participation/${participationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update participation');
      }

      const updatedParticipation = await response.json();
      
      // Update local state
      setLocalParticipations(prev =>
        prev.map(p => p._id === participationId ? updatedParticipation : p)
      );

      // Update socket state if available
      if (setParticipations) {
        setParticipations(prev =>
          prev.map(p => p._id === participationId ? updatedParticipation : p)
        );
      }

      // Clear editing state
      setEditingStates(prev => ({ ...prev, [key]: false }));
      setEditValues(prev => ({ ...prev, [key]: '' }));

      toast({
        title: 'Success',
        description: 'Name updated successfully',
        variant: 'success',
      });

    } catch (error) {
      console.error('[UserList] Update participation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update name',
        variant: 'destructive',
      });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const addMember = async (participationId) => {
    const participation = localParticipations.find(p => p._id === participationId);
    const newMembers = [...(participation.members || []), ''];
    
    try {
      const response = await fetch(`/api/participation/${participationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ members: newMembers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      const updatedParticipation = await response.json();
      
      setLocalParticipations(prev =>
        prev.map(p => p._id === participationId ? updatedParticipation : p)
      );

      if (setParticipations) {
        setParticipations(prev =>
          prev.map(p => p._id === participationId ? updatedParticipation : p)
        );
      }

      // Start editing the new member immediately
      startEditing(participationId, 'members', '', newMembers.length - 1);

    } catch (error) {
      console.error('[UserList] Add member error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const removeMember = async (participationId, memberIndex) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    const participation = localParticipations.find(p => p._id === participationId);
    const newMembers = participation.members.filter((_, index) => index !== memberIndex);
    
    try {
      const response = await fetch(`/api/participation/${participationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ members: newMembers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      const updatedParticipation = await response.json();
      
      setLocalParticipations(prev =>
        prev.map(p => p._id === participationId ? updatedParticipation : p)
      );

      if (setParticipations) {
        setParticipations(prev =>
          prev.map(p => p._id === participationId ? updatedParticipation : p)
        );
      }

      toast({
        title: 'Success',
        description: 'Member removed successfully',
        variant: 'success',
      });

    } catch (error) {
      console.error('[UserList] Remove member error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

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

  const renderEditableField = (participationId, field, currentValue, memberIndex = null) => {
    const key = memberIndex !== null ? `${participationId}-${field}-${memberIndex}` : `${participationId}-${field}`;
    const isEditing = editingStates[key];
    const isSaving = saving[key];
    const isAdmin = session?.user?.isAdmin;

    if (isEditing) {
      return (
        <div className="w-full space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
            <Input
              value={editValues[key] || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
              className="flex-1 min-w-0 h-10 px-3 text-sm border-2 border-blue-300 focus:border-blue-500 rounded-md shadow-sm"
              disabled={isSaving}
              placeholder="Enter name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit(participationId, field, memberIndex);
                } else if (e.key === 'Escape') {
                  cancelEditing(participationId, field, memberIndex);
                }
              }}
              autoFocus
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => saveEdit(participationId, field, memberIndex)}
                disabled={isSaving}
                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <Check className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                onClick={() => cancelEditing(participationId, field, memberIndex)}
                disabled={isSaving}
                className="h-8 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Press Enter to save, Escape to cancel
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group w-full min-h-[2rem] py-1">
        <span className="flex-1 text-sm break-words pr-2 leading-relaxed">
          {currentValue || 'N/A'}
        </span>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => startEditing(participationId, field, currentValue, memberIndex)}
            className="h-7 w-7 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-shrink-0 ml-2"
            title="Edit name"
          >
            <Edit2 className="h-3 w-3" size={20}/>
          </Button>
        )}
      </div>
    );
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
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">User</TableHead>
              <TableHead className="w-52">Collector Name</TableHead>
              <TableHead className="w-80">Members</TableHead>
              <TableHead className="w-28">Cow Quality</TableHead>
              <TableHead className="w-20">Day</TableHead>
              <TableHead className="w-32">Time Slot</TableHead>
              <TableHead className="w-20">Shares</TableHead>
              <TableHead className="w-32">Total Amount</TableHead>
              <TableHead className="w-28">Payment Status</TableHead>
              <TableHead className="w-28">Slot Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localParticipations.length > 0 ? (
              localParticipations.map((p) => (
                <TableRow key={p._id} className="hover:bg-gray-50">
                  <TableCell className="whitespace-normal break-words py-4">
                    <div className="text-sm">
                      <div className="font-medium">{p.userId?.name}</div>
                      <div className="text-gray-500 text-xs">({p.userId?.email})</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {renderEditableField(p._id, 'collectorName', p.collectorName)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-3">
                      {Array.isArray(p.members) && p.members.length > 0 ? (
                        p.members.map((name, index) => (
                          <div key={index} className="flex items-start gap-2 group">
                            <span className="text-xs text-gray-500 mt-2 flex-shrink-0 w-4">
                              {index + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              {renderEditableField(p._id, 'members', name, index)}
                            </div>
                            {session?.user?.isAdmin && p.members.length > 1 && (
                              <Button
                                size="sm"
                                onClick={() => removeMember(p._id, index)}
                                className="h-7 w-7 p-0 bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                                title="Remove member"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No members</span>
                      )}
                      {/* {session?.user?.isAdmin && (
                        <Button
                          size="sm"
                          onClick={() => addMember(p._id)}
                          className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 flex items-center gap-1 mt-2"
                        >
                          <Plus className="h-3 w-3" />
                          Add Member
                        </Button>
                      )} */}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">{p.cowQuality}</TableCell>
                  <TableCell className="py-4">Day {p.day}</TableCell>
                  <TableCell className="whitespace-normal break-words py-4">
                    {p.slotId?.timeSlot || 'Not Assigned'}
                  </TableCell>
                  <TableCell className="py-4">{p.shares}</TableCell>
                  <TableCell className="py-4">{p.totalAmount?.toLocaleString() || '0'}</TableCell>
                  <TableCell className="py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      p.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      p.slotAssigned 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {p.slotAssigned ? 'Assigned' : 'Not Assigned'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Button
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-600 text-white hover:bg-red-700 h-8 px-3 text-xs"
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
                <TableCell colSpan={11} className="text-center py-12">
                  <div className="text-gray-500">
                    <div className="text-lg font-medium mb-2">No participations found</div>
                    <div className="text-sm">Participations will appear here once users sign up.</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="bg-primary text-white h-10 px-4"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="bg-primary text-white h-10 px-4"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}