import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIO } from '@/lib/socket';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { participationId, status } = await req.json();
    if (!participationId || !['Pending', 'Completed', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid participation ID or status' }, { status: 400 });
    }

    const participation = await Participation.findById(participationId);
    if (!participation) {
      return NextResponse.json({ error: 'Participation not found' }, { status: 404 });
    }

    participation.paymentStatus = status;
    participation.paymentDate = new Date();
    await participation.save();

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