import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-secondary mb-4">User Participations</h2>
          <p className="text-gray-600 mb-4">Download the list of all user participations.</p>
          <div className="flex space-x-4">
            <Button asChild className="bg-primary text-white">
              <a href="/api/admin/users/export?format=pdf">Download PDF</a>
            </Button>
            <Button asChild className="bg-primary text-white">
              <a href="/api/admin/users/export?format=csv">Download CSV</a>
            </Button>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-secondary mb-4">Participation Slots</h2>
          <p className="text-gray-600 mb-4">Download the list of all assigned slots.</p>
          <div className="flex space-x-4">
            <Button asChild className="bg-primary text-white">
              <a href="/api/admin/slots/export?format=pdf">Download PDF</a>
            </Button>
            <Button asChild className="bg-primary text-white">
              <a href="/api/admin/slots/export?format=csv">Download CSV</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}