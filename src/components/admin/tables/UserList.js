"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';

export default function UserList({ initialParticipations, currentPage, totalPages, setCurrentPage }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-secondary mb-4">Recent Participations</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Collector Name</TableHead>
            <TableHead>Cow Quality</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Slot Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialParticipations.length > 0 ? (
            initialParticipations.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  {p.userId?.name} ({p.userId?.email})
                </TableCell>
                <TableCell>{p.collectorName}</TableCell>
                <TableCell>{p.cowQuality}</TableCell>
                <TableCell>Day {p.day}</TableCell>
                <TableCell>{p.slotId?.timeSlot || 'Not Assigned'}</TableCell>
                <TableCell>{p.shares}</TableCell>
                <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{p.paymentStatus}</TableCell>
                <TableCell>{p.slotAssigned ? 'Assigned' : 'Not Assigned'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
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