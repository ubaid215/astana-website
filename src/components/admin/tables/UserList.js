'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function UserList({ initialParticipations, currentPage, totalPages, setCurrentPage }) {
  const [participations, setParticipations] = useState(initialParticipations);
  const { addToast } = useToast();

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this participation?')) return;

    try {
      const res = await fetch(`/api/participation/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setParticipations(participations.filter((p) => p._id !== id));
        addToast({
          title: 'Success',
          description: 'Participation deleted successfully',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to delete participation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Server error',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL participations? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/participation', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setParticipations([]);
        setCurrentPage(1);
        addToast({
          title: 'Success',
          description: 'All participations deleted successfully',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to delete participations',
          variant: 'destructive',
        });
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Server error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-secondary">Recent Participations</h2>
        {participations.length > 0 && (
          <Button
            onClick={handleDeleteAll}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete All Participations
          </Button>
        )}
      </div>
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
          {participations.length > 0 ? (
            participations.map((p) => (
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
                <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{p.paymentStatus}</TableCell>
                <TableCell>{p.slotAssigned ? 'Assigned' : 'Not Assigned'}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleDelete(p._id)}
                    className="bg-red-600 text-white hover:bg-red-700"
                    size="sm"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                No participations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex justify-between mt-4">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="bg-primary text-white"
          >
            Previous
          </Button>
          <span className="self-center">
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