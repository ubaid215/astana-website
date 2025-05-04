import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import UserList from '@/components/admin/tables/UserList';
import { Button } from '@/components/ui/Button';

export default async function UsersPage() {
  await connectDB();
  const participations = await Participation.find().sort({ createdAt: -1 });

  return (
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">User Participations</h1>
      <div className="flex justify-end mb-4">
        <Button asChild className="bg-primary text-white mr-2">
          <a href="/api/admin/users/export?format=pdf">Download PDF</a>
        </Button>
        <Button asChild className="bg-primary text-white">
          <a href="/api/admin/users/export?format=csv">Download CSV</a>
        </Button>
      </div>
      <UserList initialParticipations={JSON.parse(JSON.stringify(participations))} />
    </div>
  );
}