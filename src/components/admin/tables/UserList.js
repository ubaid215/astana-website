"use client";

import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';

export default function UserList({ initialParticipations }) {
  const { participations, setParticipations } = useSocket();

  useEffect(() => {
    setParticipations(initialParticipations || []);
  }, [initialParticipations, setParticipations]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">User Participations</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collector Name</TableHead>
            <TableHead>WhatsApp Number</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participations.length > 0 ? (
            participations.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{p.collectorName}</TableCell>
                <TableCell>{p.whatsappNumber}</TableCell>
                <TableCell>{p.country}</TableCell>
                <TableCell>{p.members.join(', ')}</TableCell>
                <TableCell>{p.totalAmount.toLocaleString()}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No participations yet</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}