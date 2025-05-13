import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Payment from '@/lib/db/models/Payment';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = await getToken({ req });
    if (!token?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { participationId: { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = new Date(fromDate);
      if (toDate) query.paymentDate.$lte = new Date(toDate);
    }

    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name')
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return NextResponse.json({ 
      payments: payments.map(p => ({
        _id: p._id.toString(),
        transactionId: p.transactionId,
        participationId: p.participationId,
        userId: {
          _id: p.userId?._id?.toString(),
          name: p.userId?.name
        },
        amount: p.amount,
        paymentStatus: p.paymentStatus,
        paymentDate: p.paymentDate,
        screenshot: p.screenshot
      })),
      totalCount
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}