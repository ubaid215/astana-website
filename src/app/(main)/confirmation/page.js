"use client";

import { useEffect, useState } from 'react';
import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';

export default function ConfirmationPage({ searchParams }) {
  const [participation, setParticipation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParticipation = async () => {
      try {
        await connectDB();
        const participation = await Participation.findById(searchParams.participationId);
        if (!participation) {
          setError('Participation not found');
          return;
        }
        setParticipation(participation);
      } catch (err) {
        setError('Server error');
      }
    };
    if (searchParams.participationId) {
      fetchParticipation();
    }
  }, [searchParams.participationId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!participation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-primary text-center mb-6">Submission Successful</h1>
        <div className="space-y-4">
          <p><strong>Collector Name:</strong> {participation.collectorName}</p>
          <p><strong>WhatsApp Number:</strong> {participation.whatsappNumber}</p>
          <p><strong>Country:</strong> {participation.country}</p>
          <p><strong>Cow Quality:</strong> {participation.cowQuality}</p>
          <p><strong>Time Slot:</strong> {participation.timeSlot || 'To be assigned'}</p>
          <p><strong>Day:</strong> Day {participation.day}</p>
          <p><strong>Shares:</strong> {participation.shares}</p>
          <p><strong>Members:</strong> {participation.members.join(', ')}</p>
          <p><strong>Total Amount:</strong> {participation.totalAmount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}