export const dynamic = 'force-dynamic';

import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import SlotTable from '@/components/admin/tables/SlotTable';
import { Button } from '@/components/ui/Button';

export default async function SlotsPage() {
  await connectDB();
  const slots = await Slot.find().sort({ day: 1, timeSlot: 1 });

  return (
    <div className="min-h-screen bg-background p-6 ml-0">
      <h1 className="text-3xl font-bold text-primary mb-8">Participation Slots</h1>
      <div className="flex justify-end mb-4">
        <Button asChild className="bg-primary text-white mr-2">
          <a href="/api/admin/slots/export?format=pdf">Download PDF</a>
        </Button>
        <Button asChild className="bg-primary text-white">
          <a href="/api/admin/slots/export?format=csv">Download CSV</a>
        </Button>
      </div>
      <SlotTable initialSlots={JSON.parse(JSON.stringify(slots))} day={1} />
      <SlotTable initialSlots={JSON.parse(JSON.stringify(slots))} day={2} />
    </div>
  );
}