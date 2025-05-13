'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { SearchIcon } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          status: filters.status,
          search: filters.search,
          fromDate: filters.fromDate,
          toDate: filters.toDate
        }).toString();

        const res = await fetch(`/api/admin/payments/history?${query}`);
        const data = await res.json();

        if (res.ok) {
          setPayments(data.payments);
          setTotalPayments(data.totalCount);
        } else {
          setError(data.error || 'Failed to load payments');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [currentPage, filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const totalPages = Math.ceil(totalPayments / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment History</h1>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <Input 
              type="date" 
              value={filters.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <Input 
              type="date" 
              value={filters.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Input 
                placeholder="Search transactions..." 
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <SearchIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Participation ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Proof</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell className="font-medium">{payment.transactionId}</TableCell>
                  <TableCell>{payment.userId?.name || 'Unknown'}</TableCell>
                  <TableCell>{payment.participationId}</TableCell>
                  <TableCell>PKR {payment.amount?.toLocaleString() || '0'}</TableCell>
                  <TableCell>
                    {payment.paymentDate ? format(new Date(payment.paymentDate), 'PP') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      payment.paymentStatus === 'Completed' ? 'success' :
                      payment.paymentStatus === 'Rejected' ? 'destructive' : 'warning'
                    }>
                      {payment.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.screenshot ? (
                      <a 
                        href={payment.screenshot} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    ) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No payment records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalPayments)} of {totalPayments} entries
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}