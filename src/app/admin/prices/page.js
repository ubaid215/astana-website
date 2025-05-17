"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useSocket } from '@/hooks/useSocket';

export default function PricesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { emit, connected } = useSocket();

  const form = useForm({
    defaultValues: {
      standard: { price: 25000, message: '' },
      medium: { price: 30000, message: '' },
      premium: { price: 35000, message: '' },
    },
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/admin/prices');
        const data = await res.json();
        if (res.ok) {
          form.reset({
            standard: { price: data.standard.price, message: data.standard.message },
            medium: { price: data.medium.price, message: data.medium.message },
            premium: { price: data.premium.price, message: data.premium.message },
          });
        }
      } catch (err) {
        setError('Failed to fetch prices');
      }
    };
    fetchPrices();
  }, [form]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        if (connected) {
          emit('pricesUpdated', data);
          console.log('[PricesPage] Emitted price update via Socket.IO:', data);
        } else {
          console.warn('[PricesPage] Socket not connected, price update not emitted');
        }
        
        setMessage('Prices updated successfully');
        form.reset(data);
      } else {
        setError(result.error || 'Failed to update prices');
      }
    } catch (err) {
      console.error('[PricesPage] Error updating prices:', err);
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 ml-0">
      <h1 className="text-3xl font-bold text-primary mb-8">Manage Cow Prices</h1>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        {!connected && (
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            Socket connection not established. Price updates may not be reflected in real-time.
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && <p className="text-red-600">{error}</p>}
            {message && <p className="text-green-600">{message}</p>}
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="standard.price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Price (per share)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standard.message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Message</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter message for Standard tier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="medium.price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medium Price (per share)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medium.message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medium Message</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter message for Medium tier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="premium.price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Price (per share)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premium.message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Message</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter message for Premium tier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full bg-primary text-white" disabled={loading}>
              {loading ? 'Updating...' : 'Update Prices'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
