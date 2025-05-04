'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const downloadReport = async (type) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reports/${type}`);
      if (!res.ok) {
        throw new Error('Failed to generate report');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 ml-0 md:ml-64">
      <h1 className="text-3xl font-bold text-primary mb-8">Reports</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="bg-white  rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-secondary mb-4">Download Reports</h2>
        <div className="flex items-center justify-center gap-7">
          <Button
            onClick={() => downloadReport('participations')}
            disabled={loading}
            className="bg-primary text-white"
          >
            {loading ? 'Generating...' : 'Download Participation Report'}
          </Button>
          <Button
            onClick={() => downloadReport('payments')}
            disabled={loading}
            className="bg-primary text-white"
          >
            {loading ? 'Generating...' : 'Download Payment Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}