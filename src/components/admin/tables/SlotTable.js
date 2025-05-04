import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useSocket } from '@/hooks/useSocket';

export default function SlotTable({ initialSlots, day }) {
  const { slots, setSlots } = useSocket();

  useEffect(() => {
    setSlots(initialSlots || []);
  }, [initialSlots, setSlots]);

  const filteredSlots = slots.filter((s) => s.day === day);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Day {day} Slots</h2>
      {filteredSlots.length > 0 ? (
        filteredSlots.map((slot, index) => (
          <div key={slot._id} className="mb-8 break-after-page">
            <h3 className="text-lg font-semibold text-secondary mb-2">
              Slot {index + 1}: {slot.timeSlot} - {slot.cowQuality} ({slot.country})
            </h3>
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