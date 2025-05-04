import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import UserList from '@/components/admin/tables/UserList';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default async function AdminDashboard() {
  await connectDB();
  const participations = await Participation.find().sort({ createdAt: -1 }).limit(10);
  const slots = await Slot.find().sort({ day: 1, timeSlot: 1 });

  return (
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserList initialParticipations={JSON.parse(JSON.stringify(participations))} />
        </div>
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-secondary mb-4">Quick Stats</h2>
            <p className="text-gray-600">Total Users: {participations.length}</p>
            <p className="text-gray-600">Total Slots: {slots.length}</p>
            <Button asChild className="mt-4 bg-primary text-white">
              <Link href="/admin/reports">View Reports</Link>
            </Button>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-secondary mb-4">Recent Slots</h2>
            {slots.slice(0, 3).map((slot) => (
              <p key={slot._id} className="text-gray-600">
                Day {slot.day}: {slot.timeSlot} ({slot.cowQuality})
              </p>
            ))}
            <Button asChild className="mt-4 bg-primary text-white">
              <Link href="/admin/slots">View All Slots</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}