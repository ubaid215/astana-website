export const dynamic = 'force-dynamic';

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIO } from '@/lib/socket';
import mongoose from 'mongoose';

// Re-import the schema to ensure we're using the latest definition
import ParticipationSchema from '@/lib/db/models/Participation';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Admin Payments API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const participations = await Participation.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    return NextResponse.json(participations, { status: 200 });
  } catch (error) {
    console.error('[Admin Payments API] Fetch payments error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Admin Payments API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Debug: Log the schema's enum values for paymentStatus
    const schemaEnum = mongoose.model('Participation').schema.paths.paymentStatus.options.enum;
    console.log('[Admin Payments API] paymentStatus enum values:', schemaEnum);

    // If 'Rejected' is not in the enum, there’s a schema mismatch
    if (!schemaEnum.includes('Rejected')) {
      console.warn('[Admin Payments API] Schema mismatch detected. Reloading Participation model...');
      delete mongoose.models.Participation; // Clear cached model
      mongoose.model('Participation', ParticipationSchema); // Reload model
      console.log('[Admin Payments API] Reloaded schema enum:', mongoose.model('Participation').schema.paths.paymentStatus.options.enum);
    }

    const { participationId, status } = await req.json();
    console.log('[Admin Payments API] Received PATCH request:', { participationId, status });

    if (!participationId || !['Pending', 'Completed', 'Rejected'].includes(status)) {
      console.error('[Admin Payments API] Invalid input:', { participationId, status });
      return NextResponse.json({ error: 'Invalid participation ID or status' }, { status: 400 });
    }

    const participation = await Participation.findById(participationId);
    if (!participation) {
      console.error('[Admin Payments API] Participation not found:', participationId);
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    console.log('[Admin Payments API] Before update:', { _id: participation._id, paymentStatus: participation.paymentStatus });
    participation.paymentStatus = status;
    participation.paymentDate = new Date();
    await participation.save();
    console.log('[Admin Payments API] After update:', { _id: participation._id, paymentStatus: participation.paymentStatus });

    // Emit Socket.io event
    const io = getIO();
    if (io) {
      io.to('public').emit('paymentUpdate', participation);
      console.log('[Admin Payments API] Socket.io paymentUpdate emitted:', { participationId });
    } else {
      console.warn('[Admin Payments API] Socket.io not initialized, skipping paymentUpdate');
    }

    return NextResponse.json({ message: 'Payment status updated' }, { status: 200 });
  } catch (error) {
    console.error('[Admin Payments API] Update payment status error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}