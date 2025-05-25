'use client';

import { useEffect, useCallback, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Edit2, Check, X, GripVertical, RotateCcw } from 'lucide-react';

// Global drag state to share between component instances
let globalDragState = {
  draggedSlot: null,
  dragInProgress: false,
  sourceDay: null,
};

export default function SlotTable({ initialSlots, day }) {
  const { socket, connected, slots, setSlots } = useSocket();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const isAdmin = status === 'authenticated' && session?.user?.isAdmin;

  console.log('[SlotTable] isAdmin:', isAdmin, 'status:', status, 'session:', session);

  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [canUndo, setCanUndo] = useState(() => {
    return localStorage.getItem('canUndo') === 'true';
  });
  const [undoChecked, setUndoChecked] = useState(false); // Track if we've checked undo availability
  const [undoError, setUndoError] = useState(null); // Track errors in undo availability check

  // Check if undo is available on the server when the component mounts
  useEffect(() => {
    const checkUndoAvailability = async () => {
      try {
        const response = await fetch('/api/slots/undo-available', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check undo availability');
        }

        const data = await response.json();
        console.log('[SlotTable] Undo availability:', data);
        setCanUndo(data.canUndo);
        setUndoChecked(true);
        setUndoError(null);
      } catch (error) {
        console.error('[SlotTable] Error checking undo availability:', error.message);
        setUndoError(error.message);
        setUndoChecked(true);
        // Do not show toast repeatedly; we'll display the error in the UI
      }
    };

    if (isAdmin && !undoChecked) {
      checkUndoAvailability();
    }
  }, [isAdmin, undoChecked]);

  // Sync canUndo with localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('canUndo', canUndo.toString());
  }, [canUndo]);

  // Debug state updates
  useEffect(() => {
    console.log('[SlotTable] editingParticipant updated:', editingParticipant);
  }, [editingParticipant]);

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

    const handleParticipantNameUpdated = ({ slotId, participationId, index, newName }) => {
      console.log('Received name update:', { slotId, participationId, index, newName });
      
      setSlots(prevSlots => {
        return prevSlots.map(slot => {
          if (slot._id.toString() === slotId) {
            return {
              ...slot,
              participants: slot.participants.map(participant => {
                if (participant.participationId.toString() === participationId) {
                  const updatedNames = [...participant.participantNames];
                  updatedNames[index] = newName;
                  return { ...participant, participantNames: updatedNames };
                }
                return participant;
              })
            };
          }
          return slot;
        });
      });
    };

    const handleMergePerformed = () => {
      setCanUndo(true);
      setUndoChecked(true);
      setUndoError(null);
      toast({
        title: 'Merge Performed',
        description: 'Slots merged successfully. You can undo this action.',
        variant: 'success',
      });
    };

    const handleMergeUndone = () => {
      setCanUndo(false);
      setUndoChecked(true);
      setUndoError(null);
      toast({
        title: 'Merge Undone',
        description: 'The last merge operation was successfully undone.',
        variant: 'success',
      });
    };

    socket.on('slotCreated', handleSlotCreated);
    socket.on('slotDeleted', handleSlotDeleted);
    socket.on('slotUpdated', handleSlotUpdated);
    socket.on('slotCompleted', handleSlotCompleted);
    socket.on('participantNameUpdated', handleParticipantNameUpdated);
    socket.on('mergePerformed', handleMergePerformed);
    socket.on('mergeUndone', handleMergeUndone);
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
      socket.off('participantNameUpdated', handleParticipantNameUpdated);
      socket.off('mergePerformed', handleMergePerformed);
      socket.off('mergeUndone', handleMergeUndone);
      socket.off('connect_error');
      console.log('[SlotTable] Cleaned up socket event listeners');
    };
  }, [socket, connected, setSlots, toast, day]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globalDragState.dragInProgress) {
        setForceUpdate(prev => prev + 1);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const validateName = (name) => {
    if (!name || name.trim() === '') {
      return 'Participant name cannot be empty';
    }
    if (!/^[a-zA-Z\s-]+$/.test(name)) {
      return 'Name can only contain letters, spaces, and hyphens';
    }
    if (name.length > 100) {
      return 'Name cannot exceed 100 characters';
    }
    return '';
  };

  const handleEditParticipantName = useCallback(
    async (slotId, participationId, index, newName) => {
      try {
        if (status !== 'authenticated' || !session?.user?.isAdmin) {
          throw new Error('Admin access required');
        }

        const validationError = validateName(newName);
        if (validationError) {
          setNameError(validationError);
          return;
        }

        console.log('Updating name:', { participationId, index, newName });

        const response = await fetch('/api/participation/update-name', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            participationId, 
            index, 
            newName 
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update name');
        }

        setEditingParticipant(null);
        setEditedName('');
        setNameError('');
        
      } catch (error) {
        console.error('Error updating name:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
    [toast, session, status]
  );

  const startEditing = (slotId, participationId, index, currentName) => {
    const slotIdStr = slotId.toString();
    const participationIdStr = participationId.toString();
    console.log('[SlotTable] Starting edit:', {
      slotId: slotIdStr,
      slotIdType: typeof slotIdStr,
      participationId: participationIdStr,
      participationIdType: typeof participationIdStr,
      index,
      indexType: typeof index,
      currentName
    });
    setEditingParticipant({ slotId: slotIdStr, participationId: participationIdStr, index });
    setEditedName(currentName);
    setNameError('');
    setShowConfirm(null);
  };

  const cancelEditing = () => {
    console.log('[SlotTable] Canceling edit');
    setEditingParticipant(null);
    setEditedName('');
    setNameError('');
    setShowConfirm(null);
  };

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

  const handleUndoMerge = useCallback(async () => {
    try {
      if (status !== 'authenticated' || !session?.user?.isAdmin) {
        throw new Error('Admin access required');
      }

      console.log('[SlotTable] Initiating undo merge request');
      const response = await fetch('/api/slots/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[SlotTable] Undo response status:', response.status);
      if (!response.ok) {
        let errorMessage = 'Failed to undo merge';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('[SlotTable] Failed to parse JSON response:', jsonError);
          const responseText = await response.text();
          console.error('[SlotTable] Raw response:', responseText);
          errorMessage = 'Invalid server response';
        }
        throw new Error(errorMessage);
      }

      const updatedSlots = await response.json();
      setSlots(updatedSlots);
      const checkResponse = await fetch('/api/slots/undo-available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        setCanUndo(data.canUndo);
        setUndoChecked(true);
        setUndoError(null);
      } else {
        setCanUndo(false);
        setUndoChecked(true);
        setUndoError('Failed to check undo availability after undo');
      }
      toast({
        title: 'Success',
        description: 'Merge undone successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('[SlotTable] Error undoing merge:', error.message);
      toast({
        title: 'Error',
        description: `Failed to undo merge: ${error.message}`,
        variant: 'destructive',
      });
    }
  }, [toast, session, status, setSlots]);

  const canSlotAccommodate = (targetSlot, draggedSlot) => {
    if (!targetSlot || !draggedSlot) return false;
    if (targetSlot.cowQuality !== draggedSlot.cowQuality) return false;
    const currentShares = targetSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    const draggedShares = draggedSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    return currentShares + draggedShares <= 7;
  };

  const handleDragStart = (e, slot) => {
    if (!isAdmin) {
      console.warn('🚫 [SlotTable] Drag blocked - not admin');
      return;
    }

    globalDragState.draggedSlot = slot;
    globalDragState.sourceDay = day;
    globalDragState.dragInProgress = true;

    e.dataTransfer.setData('application/json', JSON.stringify({
      slotId: slot._id,
      timeSlot: slot.timeSlot,
      cowQuality: slot.cowQuality,
      participants: slot.participants,
    }));
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSlotDragEnter = (e, targetSlot) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    const canAccommodate = canSlotAccommodate(targetSlot, globalDragState.draggedSlot);
    setDragOverTarget(canAccommodate ? `slot-${targetSlot._id}` : `slot-${targetSlot._id}-invalid`);
  };

  const handleDayDragEnter = (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(`day-${day}`);
  };

  const handleDragLeave = (e) => {
    if (!isAdmin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTarget(null);
    }
  };

  const handleSlotDrop = async (e, targetSlot) => {
    if (!isAdmin) {
      console.warn('🚫 [SlotTable] Drop blocked - not admin');
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    const sourceSlot = globalDragState.draggedSlot;
    const targetDay = day;

    if (!sourceSlot || !targetSlot) return;

    if (sourceSlot._id === targetSlot._id) {
      toast({ title: 'Info', description: 'Cannot drop on the same slot', variant: 'default' });
      return;
    }

    if (sourceSlot.cowQuality !== targetSlot.cowQuality) {
      toast({ title: 'Error', description: 'Slots must have the same cow quality', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch('/api/slots/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSlotId: sourceSlot._id,
          destSlotId: targetSlot._id,
          sourceDay: globalDragState.sourceDay,
          destDay: targetDay,
        }),
      });

      if (!response.ok) throw new Error((await response.json()).message || 'Failed to merge slots');

      const updatedSlots = await response.json();
      setSlots(updatedSlots);
      toast({ title: 'Success', description: 'Slots merged successfully', variant: 'success' });
    } catch (error) {
      console.error('Error merging slots:', error.message);
      toast({ title: 'Error', description: `Failed to merge slots: ${error.message}`, variant: 'destructive' });
    } finally {
      globalDragState.draggedSlot = null;
      globalDragState.dragInProgress = false;
      globalDragState.sourceDay = null;
    }
  };

  const handleDayDrop = async (e) => {
    if (!isAdmin) {
      console.warn('🚫 [SlotTable] Drop blocked - not admin');
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    const sourceSlot = globalDragState.draggedSlot;
    const targetDay = day;

    if (!sourceSlot || globalDragState.sourceDay === targetDay) {
      toast({ title: 'Info', description: 'Cannot drop on the same day', variant: 'default' });
      return;
    }

    try {
      const response = await fetch('/api/slots/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSlotId: sourceSlot._id,
          destSlotId: null,
          sourceDay: globalDragState.sourceDay,
          destDay: targetDay,
        }),
      });

      if (!response.ok) throw new Error((await response.json()).message || 'Failed to merge slots');

      const updatedSlots = await response.json();
      setSlots(updatedSlots);
      toast({ title: 'Success', description: 'Slot moved successfully', variant: 'success' });
    } catch (error) {
      console.error('Error merging slots:', error.message);
      toast({ title: 'Error', description: `Failed to merge slots: ${error.message}`, variant: 'destructive' });
    } finally {
      globalDragState.draggedSlot = null;
      globalDragState.dragInProgress = false;
      globalDragState.sourceDay = null;
    }
  };

  const handleDragEnd = (e) => {
    console.log('🏁 [SlotTable] Drag ended');
    if (e.target) e.target.style.opacity = '1';
    setDragOverTarget(null);
    globalDragState.draggedSlot = null;
    globalDragState.dragInProgress = false;
    globalDragState.sourceDay = null;
  };

  const handleConfirmEdit = (slotId, participationId, index, newName) => {
    const slotIdStr = slotId.toString();
    const participationIdStr = participationId.toString();
    const validationError = validateName(newName);
    if (validationError) {
      setNameError(validationError);
      return;
    }
    setShowConfirm({ slotId: slotIdStr, participationId: participationIdStr, index, newName });
  };

  const cancelConfirm = () => {
    setShowConfirm(null);
    setNameError('');
  };

  const filteredSlots = slots
    .filter((s) => s.day === day)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const getSlotDropZoneClass = (slot) => {
    const baseClass = "transition-all duration-200";
    if (dragOverTarget === `slot-${slot._id}`) {
      return `${baseClass} bg-green-50 border-2 border-green-300 border-dashed shadow-inner`;
    }
    if (dragOverTarget === `slot-${slot._id}-invalid`) {
      return `${baseClass} bg-red-50 border-2 border-red-300 border-dashed shadow-inner`;
    }
    if (globalDragState.dragInProgress && canSlotAccommodate(slot, globalDragState.draggedSlot)) {
      return `${baseClass} border-2 border-gray-200 border-dashed hover:border-green-300 hover:bg-green-25`;
    }
    if (globalDragState.dragInProgress) {
      return `${baseClass} border-2 border-gray-200 border-dashed opacity-50`;
    }
    return baseClass;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary">Day {day} Slots</h2>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                Drag slots to merge within or across days
              </span>
            </div>
          )}
          {isAdmin && undoChecked && !undoError && canUndo && (
            <Button
              size="sm"
              onClick={handleUndoMerge}
              className="bg-yellow-600 hover:bg-yellow-700"
              aria-label="Undo last merge"
              title="Undo last merge"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Undo Merge
            </Button>
          )}
          {isAdmin && undoChecked && !undoError && !canUndo && (
            <div className="text-sm text-gray-600">
              No merging done before
            </div>
          )}
          {isAdmin && undoError && (
            <div className="text-sm text-red-600">
              Error checking undo availability: {undoError}
            </div>
          )}
        </div>
      </div>

      <div
        className={`overflow-x-auto transition-all duration-200 p-2 rounded-lg ${
          dragOverTarget === `day-${day}`
            ? 'bg-blue-50 border-2 border-blue-300 border-dashed shadow-inner'
            : 'border-2 border-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDayDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDayDrop}
      >
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {isAdmin && <TableHead className="w-8">Drag</TableHead>}
              <TableHead className="w-32">Time Slot</TableHead>
              <TableHead className="w-28">Cow Quality</TableHead>
              <TableHead className="w-40">Collector Name</TableHead>
              <TableHead className="w-64">Participant Names</TableHead>
              <TableHead className="w-20">Shares</TableHead>
              {isAdmin && <TableHead className="w-24">Complete</TableHead>}
              {isAdmin && <TableHead className="w-32">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSlots.length > 0 ? (
              filteredSlots.map((slot) => {
                const participantEntries = [];
                slot.participants.forEach(p => {
                  p.participantNames.forEach((name, nameIndex) => {
                    participantEntries.push({
                      name,
                      participationId: p.participationId,
                      nameIndex,
                    });
                  });
                });

                return (
                  <TableRow
                    key={slot._id}
                    className={`${getSlotDropZoneClass(slot)} hover:bg-gray-50`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleSlotDragEnter(e, slot)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleSlotDrop(e, slot)}
                    draggable={isAdmin}
                    onDragStart={(e) => handleDragStart(e, slot)}
                    onDragEnd={handleDragEnd}
                  >
                    {isAdmin && (
                      <TableCell>
                        <div className="cursor-move p-2 rounded-md hover:bg-gray-200">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{slot.timeSlot}</TableCell>
                    <TableCell>{slot.cowQuality}</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      {slot.participants.map(p => p.collectorName).join(' - ')}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words max-w-xs">
                      {participantEntries.map((entry, displayIndex) => {
                        const { name, participationId, nameIndex } = entry;
                        console.log('[SlotTable] Rendering participant:', {
                          slotId: slot._id?.toString(),
                          participationId: participationId?.toString(),
                          nameIndex,
                          displayIndex,
                          editingSlotId: editingParticipant?.slotId,
                          editingParticipationId: editingParticipant?.participationId,
                          editingIndex: editingParticipant?.index
                        });
                        return (
                          <div key={`${participationId}-${nameIndex}`} className="flex items-center space-y-1">
                            <span className="text-xs text-gray-500 mr-2">{displayIndex + 1}.</span>
                            {isAdmin && editingParticipant?.slotId === slot._id?.toString() &&
                            editingParticipant?.participationId === participationId?.toString() &&
                            editingParticipant?.index === nameIndex ? (
                              <div className="flex flex-col w-full">
                                <div className="flex items-center space-x-1">
                                  <Input
                                    value={editedName}
                                    onChange={(e) => {
                                      setEditedName(e.target.value);
                                      setNameError(validateName(e.target.value));
                                    }}
                                    className="text-xs h-6 px-2"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !nameError) {
                                        handleConfirmEdit(slot._id, participationId, nameIndex, editedName);
                                      } else if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmEdit(slot._id, participationId, nameIndex, editedName)}
                                    className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                                    aria-label="Confirm edit"
                                    title="Confirm"
                                    disabled={!!nameError || !editedName || editedName.trim() === ''}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={cancelEditing}
                                    className="h-6 w-6 p-0 bg-gray-600 hover:bg-gray-700"
                                    aria-label="Cancel editing"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                {nameError && (
                                  <span className="text-xs text-red-600 mt-1">{nameError}</span>
                                )}
                              </div>
                            ) : isAdmin && showConfirm?.slotId === slot._id?.toString() &&
                              showConfirm?.participationId === participationId?.toString() &&
                              showConfirm?.index === nameIndex ? (
                              <div className="flex flex-col w-full">
                                <span className="text-xs text-gray-600 mb-1">
                                  Confirm change to: {showConfirm.newName}?
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditParticipantName(slot._id, participationId, nameIndex, showConfirm.newName)}
                                    className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                                    aria-label="Confirm name change"
                                    title="Confirm"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={cancelConfirm}
                                    className="h-6 w-6 p-0 bg-gray-600 hover:bg-gray-700"
                                    aria-label="Cancel confirmation"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 group">
                                <span>{name}</span>
                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      startEditing(slot._id, participationId, nameIndex, name)
                                    }
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700"
                                    aria-label="Edit participant name"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {slot.participants.reduce((sum, p) => sum + p.shares, 0)}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={slot.completed || false}
                          onCheckedChange={(checked) => handleCompleteSlot(slot._id, checked)}
                        />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
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
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 5} className="text-center py-12">
                  <div className={`transition-all duration-200 ${
                    dragOverTarget === `day-${day}`
                      ? 'text-blue-600 font-medium text-lg animate-pulse'
                      : 'text-gray-500'
                  }`}>
                    {dragOverTarget === `day-${day}`
                      ? '📥 Drop slot here to add to this day'
                      : `No slots assigned for Day ${day}`}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {isAdmin && globalDragState.dragInProgress && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>💡 Drag & Drop Tips:</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Drop on a specific slot row to merge (if cow quality matches and capacity allows)</li>
                <li>Drop on the table background to move to this day (creates new slot if no match)</li>
                <li>Green highlight = slot can accommodate</li>
                <li>Red highlight = slot capacity exceeded or cow quality mismatch</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}