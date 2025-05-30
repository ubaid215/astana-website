'use client';

import { useEffect, useCallback, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Edit2, Check, X, GripVertical, RotateCcw } from 'lucide-react';

// Global drag state
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

  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState('');
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [timeSlotError, setTimeSlotError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [canUndo, setCanUndo] = useState(() => {
    return localStorage.getItem('canUndo') === 'true';
  });
  const [undoChecked, setUndoChecked] = useState(false);
  const [undoError, setUndoError] = useState(null);

  // Fetch available time slots
  const fetchAvailableTimeSlots = useCallback(async (day, cowQuality) => {
    try {
      const response = await fetch('/api/slots/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, cowQuality, shares: 7 }),
      });
      if (!response.ok) throw new Error('Failed to fetch available time slots');
      const data = await response.json();
      setAvailableTimeSlots(data.availableSlots.map(slot => ({
        timeSlot: slot.timeSlot,
        capacity: slot.capacity,
      })));
    } catch (error) {
      console.error('[SlotTable] Error fetching available time slots:', error);
      setTimeSlotError('Failed to load available time slots');
      setAvailableTimeSlots([]);
    }
  }, []);

  // Check undo availability
  useEffect(() => {
    const checkUndoAvailability = async () => {
      try {
        const response = await fetch('/api/slots/undo-available', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 204 || !response.body) {
          throw new Error('No content returned from server');
        }

        let errorData = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error('[SlotTable] Failed to parse response JSON:', jsonError);
          throw new Error('Invalid server response format');
        }

        if (!response.ok) {
          throw new Error(errorData.error || 'Failed to check undo availability');
        }

        setCanUndo(errorData.canUndo || false);
        setUndoChecked(true);
        setUndoError(null);
      } catch (error) {
        console.error('[SlotTable] Error checking undo availability:', error.message);
        setUndoError(error.message || 'Unable to check undo availability');
        setUndoChecked(true);
      }
    };

    if (isAdmin && !undoChecked) {
      checkUndoAvailability();
    }
  }, [isAdmin, undoChecked]);

  useEffect(() => {
    localStorage.setItem('canUndo', canUndo.toString());
  }, [canUndo]);

  useEffect(() => {
    const filteredInitial = initialSlots.filter(s => s.day === day);
    setSlots(filteredInitial);
  }, [initialSlots, day, setSlots]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleSlotCreated = (newSlot) => {
      if (newSlot.day === day) {
        setSlots((prevSlots) => [...prevSlots, newSlot].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)));
        toast({ title: 'Slot Created', description: `New slot added for ${newSlot.timeSlot}`, variant: 'success' });
      }
    };

    const handleSlotDeleted = ({ slotId }) => {
      setSlots((prevSlots) => prevSlots.filter((slot) => slot._id !== slotId));
      toast({ title: 'Slot Deleted', description: 'Slot removed.', variant: 'info' });
    };

    const handleSlotUpdated = (updatedSlot) => {
      if (updatedSlot.day === day) {
        setSlots((prevSlots) => {
          const updatedSlots = prevSlots.filter((slot) => slot._id !== updatedSlot._id);
          updatedSlots.push(updatedSlot);
          return updatedSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        toast({ title: 'Slot Updated', description: `Slot ${updatedSlot.timeSlot} updated`, variant: 'info' });
      }
    };

    const handleSlotCompleted = ({ slotId, completed, day: slotDay }) => {
      if (slotDay === day) {
        setSlots((prevSlots) => {
          const updatedSlots = prevSlots.map((slot) =>
            slot._id.toString() === slotId.toString() ? { ...slot, completed } : slot
          );
          return updatedSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        });
        toast({ title: 'Slot Completion Updated', description: `Slot marked as ${completed ? 'completed' : 'incomplete'}`, variant: 'success' });
      }
    };

    const handleParticipantNameUpdated = ({ slotId, participationId, index, newName }) => {
      setSlots(prevSlots => {
        const updatedSlots = prevSlots.map(slot => {
          if (slot._id.toString() === slotId.toString()) {
            return {
              ...slot,
              participants: slot.participants.map(participant => {
                if (participant.participationId.toString() === participationId.toString()) {
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
        return updatedSlots;
      });
      toast({ title: 'Participant Name Updated', description: `Name updated to ${newName}`, variant: 'success' });
    };

    const handleMergePerformed = () => {
      setCanUndo(true);
      setUndoChecked(true);
      setUndoError(null);
      toast({ title: 'Merge Performed', description: 'Slots merged successfully.', variant: 'success' });
    };

    const handleMergeUndone = () => {
      setCanUndo(false);
      setUndoChecked(true);
      setUndoError(null);
      toast({ title: 'Merge Undone', description: 'Merge operation undone.', variant: 'success' });
    };

    socket.on('slotCreated', handleSlotCreated);
    socket.on('slotDeleted', handleSlotDeleted);
    socket.on('slotUpdated', handleSlotUpdated);
    socket.on('slotCompleted', handleSlotCompleted);
    socket.on('participantNameUpdated', handleParticipantNameUpdated);
    socket.on('mergePerformed', handleMergePerformed);
    socket.on('mergeUndone', handleMergeUndone);
    socket.on('connect_error', (error) => {
      toast({ title: 'Connection Error', description: 'Failed to connect to real-time updates.', variant: 'destructive' });
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
    };
  }, [socket, connected, setSlots, toast, day]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globalDragState.dragInProgress) setForceUpdate(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const validateName = (name) => {
    if (!name || name.trim() === '') return 'Participant name cannot be empty';
    if (!/^[a-zA-Z\s-]+$/.test(name)) return 'Name can only contain letters, spaces, and hyphens';
    if (name.length > 100) return 'Name cannot exceed 100 characters';
    return '';
  };

  const handleEditParticipantName = useCallback(
    async (slotId, participationId, index, newName) => {
      try {
        if (!isAdmin) throw new Error('Admin access required');
        const validationError = validateName(newName);
        if (validationError) {
          setNameError(validationError);
          return;
        }
        const response = await fetch('/api/participation/update-name', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participationId, index, newName }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update name');
        }
        setEditingParticipant(null);
        setEditedName('');
        setNameError('');
        toast({ title: 'Success', description: 'Participant name updated', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error', description: error.message || 'Failed to update name', variant: 'destructive' });
      }
    },
    [toast, isAdmin]
  );

  const startEditing = (slotId, participationId, index, currentName) => {
    setEditingParticipant({ slotId: slotId.toString(), participationId: participationId.toString(), index });
    setEditedName(currentName);
    setNameError('');
    setShowConfirm(null);
  };

  const startEditingTimeSlot = (slotId, currentTimeSlot, cowQuality) => {
    setEditingTimeSlot(slotId.toString());
    setSelectedTimeSlot(currentTimeSlot);
    fetchAvailableTimeSlots(day, cowQuality);
    setTimeSlotError('');
  };

  const cancelEditingTimeSlot = () => {
    setEditingTimeSlot(null);
    setSelectedTimeSlot('');
    setAvailableTimeSlots([]);
    setTimeSlotError('');
  };

  const handleEditTimeSlot = async (slotId) => {
    try {
      if (!isAdmin) throw new Error('Admin access required');
      if (!selectedTimeSlot) {
        setTimeSlotError('Please select a time slot');
        return;
      }
      const response = await fetch('/api/slots/update-time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, timeSlot: selectedTimeSlot }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update time slot');
      }
      const updatedSlot = await response.json();
      setSlots((prevSlots) => {
        const updatedSlots = prevSlots.filter((slot) => slot._id !== updatedSlot._id);
        updatedSlots.push(updatedSlot);
        return updatedSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
      });
      setEditingTimeSlot(null);
      setSelectedTimeSlot('');
      setAvailableTimeSlots([]);
      setTimeSlotError('');
      toast({ title: 'Success', description: 'Time slot updated', variant: 'success' });
    } catch (error) {
      setTimeSlotError(error.message || 'Failed to update time slot');
      toast({ title: 'Error', description: error.message || 'Failed to update time slot', variant: 'destructive' });
    }
  };

  const handleDeleteSlot = useCallback(
    async (slotId) => {
      try {
        if (!isAdmin) throw new Error('Authentication required');
        const response = await fetch(`/api/slots/${slotId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete slot');
        }
        toast({ title: 'Success', description: 'Slot deleted', variant: 'success' });
      } catch (error) {
        toast({ title: 'Error', description: `Failed to delete slot: ${error.message}`, variant: 'destructive' });
      }
    },
    [toast, isAdmin]
  );

  const confirmDeleteSlot = useCallback(
    (slotId) => {
      if (window.confirm('Are you sure you want to delete this slot?')) handleDeleteSlot(slotId);
    },
    [handleDeleteSlot]
  );

  const handleCompleteSlot = useCallback(
    async (slotId, completed) => {
      try {
        if (!isAdmin) throw new Error('Admin access required');
        const response = await fetch('/api/slots/complete', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotId, completed }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update slot completion');
        }
        toast({ title: 'Success', description: `Slot marked as ${completed ? 'completed' : 'incomplete'}`, variant: 'success' });
      } catch (error) {
        toast({ title: 'Error', description: `Failed to update slot: ${error.message}`, variant: 'destructive' });
      }
    },
    [toast, isAdmin]
  );

  const handleUndoMerge = useCallback(async (slotId) => {
  try {
    if (!isAdmin) throw new Error('Admin access required');
    const response = await fetch('/api/slots/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to undo merge');
    }
    const updatedSlots = await response.json();
    setSlots(updatedSlots);
    setCanUndo(false); // Reset undo flag after successful undo
    setUndoChecked(true);
    setUndoError(null);
    toast({ title: 'Success', description: 'Merge undone', variant: 'success' });
  } catch (error) {
    toast({ title: 'Error', description: `Failed to undo merge: ${error.message}`, variant: 'destructive' });
  }
}, [toast, isAdmin, setSlots]);

  const canSlotAccommodate = (targetSlot, draggedSlot) => {
    if (!targetSlot || !draggedSlot) return false;
    if (targetSlot.cowQuality !== draggedSlot.cowQuality) return false;
    const currentShares = targetSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    const draggedShares = draggedSlot.participants.reduce((sum, p) => sum + p.shares, 0);
    return currentShares + draggedShares <= 7;
  };

  const handleDragStart = (e, slot) => {
    if (!isAdmin) return;
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
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSlotDragEnter = (e, targetSlot) => {
    if (!isAdmin) return;
    e.preventDefault();
    const canAccommodate = canSlotAccommodate(targetSlot, globalDragState.draggedSlot);
    setDragOverTarget(canAccommodate ? `slot-${targetSlot._id}` : `slot-${targetSlot._id}-invalid`);
  };

  const handleDayDragEnter = (e) => {
    if (!isAdmin) return;
    e.preventDefault();
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
    if (!isAdmin) return;
    e.preventDefault();
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
      toast({ title: 'Error', description: `Failed to merge slots: ${error.message}`, variant: 'destructive' });
    } finally {
      globalDragState.draggedSlot = null;
      globalDragState.dragInProgress = false;
      globalDragState.sourceDay = null;
    }
  };

  const handleDayDrop = async (e) => {
    if (!isAdmin) return;
    e.preventDefault();
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
      toast({ title: 'Error', description: `Failed to merge slots: ${error.message}`, variant: 'destructive' });
    } finally {
      globalDragState.draggedSlot = null;
      globalDragState.dragInProgress = false;
      globalDragState.sourceDay = null;
    }
  };

  const handleDragEnd = (e) => {
    if (e.target) e.target.style.opacity = '1';
    setDragOverTarget(null);
    globalDragState.draggedSlot = null;
    globalDragState.dragInProgress = false;
    globalDragState.sourceDay = null;
  };

  const handleConfirmEdit = (slotId, participationId, index, newName) => {
    const validationError = validateName(newName);
    if (validationError) {
      setNameError(validationError);
      return;
    }
    handleEditParticipantName(slotId, participationId, index, newName);
  };

  const cancelEditing = () => {
    setEditingParticipant(null);
    setEditedName('');
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
    <div className="min-h-screen bg-background p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-primary">Day {day} Slots</h2>
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
                onClick={() => handleUndoMerge(null)}
                className="bg-yellow-600 hover:bg-yellow-700"
                aria-label="Undo last merge"
                title="Undo last merge"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Undo Last Merge
              </Button>
            )}
            {isAdmin && undoChecked && !undoError && !canUndo && (
              <div className="text-sm text-gray-600">
                No merging done before
              </div>
            )}
            {isAdmin && undoError && (
              <div className="text-sm text-red-600">
                Unable to check undo availability. Please try again later.
              </div>
            )}
          </div>
        </div>

        <div
          className={`overflow-x-auto transition-all duration-200 p-4 rounded-lg border ${dragOverTarget === `day-${day}`
              ? 'bg-blue-50 border-2 border-blue-300 border-dashed shadow-inner'
              : 'border-gray-200'
            }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDayDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDayDrop}
        >
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-50">
                {isAdmin && <TableHead className="w-8">Drag</TableHead>}
                <TableHead className="w-32 font-semibold text-secondary">Time Slot</TableHead>
                <TableHead className="w-28 font-semibold text-secondary">Cow Quality</TableHead>
                <TableHead className="w-40 font-semibold text-secondary">Collector Name</TableHead>
                <TableHead className="w-64 font-semibold text-secondary">Participant Names</TableHead>
                <TableHead className="w-20 font-semibold text-secondary">Shares</TableHead>
                {isAdmin && <TableHead className="w-24 font-semibold text-secondary">Complete</TableHead>}
                {isAdmin && <TableHead className="w-32 font-semibold text-secondary">Actions</TableHead>}
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

                  const isMerged = slot.mergeMetadata && slot.mergeMetadata.length > 0;

                  return (
                    <TableRow
                      key={slot._id}
                      className={`${getSlotDropZoneClass(slot)} ${isMerged ? 'bg-yellow-50' : ''} hover:bg-gray-100 transition-colors`}
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
                      <TableCell className="font-medium text-gray-800">
                        {isAdmin && editingTimeSlot === slot._id.toString() ? (
                          <div className="flex flex-col w-full">
                            <div className="flex items-center space-x-2">
                              <Select
                                value={selectedTimeSlot}
                                onValueChange={(value) => {
                                  setSelectedTimeSlot(value);
                                  setTimeSlotError('');
                                }}
                              >
                                <SelectTrigger className="text-sm h-8 px-3 border-gray-300">
                                  <SelectValue placeholder="Select time slot" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTimeSlots.map((slot) => (
                                    <SelectItem key={slot.timeSlot} value={slot.timeSlot} className="text-sm">
                                      {slot.timeSlot} (Capacity: {slot.capacity})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => handleEditTimeSlot(slot._id)}
                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                aria-label="Confirm time slot edit"
                                title="Confirm"
                                disabled={!selectedTimeSlot}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={cancelEditingTimeSlot}
                                className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700"
                                aria-label="Cancel time slot editing"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {timeSlotError && (
                              <span className="text-sm text-red-600 mt-2">{timeSlotError}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 group">
                            <span>{slot.timeSlot} (Capacity: {7 - slot.participants.reduce((sum, p) => sum + p.shares, 0)})</span>
                            {isAdmin && (
                              <Button
                                size="sm"
                                onClick={() => startEditingTimeSlot(slot._id, slot.timeSlot, slot.cowQuality)}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700"
                                aria-label="Edit time slot"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {slot.cowQuality}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words text-gray-800">
                        {slot.participants.map((p, index) => (
                          <span
                            key={`${p.participationId}-${index}`}
                            className={isMerged ? 'text-purple-600 font-medium' : ''}
                          >
                            {p.collectorName}
                            {index < slot.participants.length - 1 ? ' - ' : ''}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell className="whitespace-normal break-words max-w-xs text-gray-800">
                        {participantEntries.map((entry, displayIndex) => (
                          <div key={`${entry.participationId}-${entry.nameIndex}`} className="flex items-center space-y-1">
                            <span className="text-sm text-gray-500 mr-2">{displayIndex + 1}.</span>
                            {isAdmin && editingParticipant?.slotId === slot._id?.toString() &&
                              editingParticipant?.participationId === entry.participationId?.toString() &&
                              editingParticipant?.index === entry.nameIndex ? (
                              <div className="flex flex-col w-full">
                                <div className="flex items-center space-x-2">
                                  <Input
                                    value={editedName}
                                    onChange={(e) => {
                                      setEditedName(e.target.value);
                                      setNameError(validateName(e.target.value));
                                    }}
                                    className="text-sm h-8 px-3 border-gray-300"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !nameError) {
                                        handleConfirmEdit(slot._id, entry.participationId, entry.nameIndex, editedName);
                                      } else if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmEdit(slot._id, entry.participationId, entry.nameIndex, editedName)}
                                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                    aria-label="Confirm edit"
                                    title="Confirm"
                                    disabled={!!nameError || !editedName || editedName.trim() === ''}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={cancelEditing}
                                    className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700"
                                    aria-label="Cancel editing"
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {nameError && (
                                  <span className="text-sm text-red-600 mt-2">{nameError}</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 group">
                                <span className={isMerged ? 'text-blue-600' : 'text-gray-800'}>{entry.name}</span>
                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    onClick={() => startEditing(slot._id, entry.participationId, entry.nameIndex, entry.name)}
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700"
                                    aria-label="Edit participant name"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
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
                            className="h-5 w-5"
                          />
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            {slot.participants.length === 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteSlot(slot._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </Button>
                            )}
                            {isMerged && (
                              <Button
                                size="sm"
                                onClick={() => handleUndoMerge(slot._id)}
                                className="bg-yellow-600 hover:bg-yellow-700"
                                aria-label="Undo merge for this slot"
                                title="Undo Merge"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Undo
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 5} className="text-center py-12">
                    <div className={`transition-all duration-200 ${dragOverTarget === `day-${day}`
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
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="text-sm text-blue-800">
                <strong className="font-semibold">💡 Drag & Drop Tips:</strong>
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Drop on a slot row to merge (if cow quality matches and capacity allows)</li>
                  <li>Drop on the table background to move to this day</li>
                  <li>Green highlight = slot can accommodate</li>
                  <li>Red highlight = slot capacity exceeded or cow quality mismatch</li>
                  <li>Yellow background = merged slot (click Undo to revert)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}