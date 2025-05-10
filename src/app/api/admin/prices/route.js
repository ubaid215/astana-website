export const dynamic = 'force-dynamic';

import connectDB from '@/lib/db/mongodb';
import Price from '@/lib/db/models/Price';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    await connectDB();
    let price = await Price.findOne();
    if (!price) {
      price = await Price.create({ standard: 25000, medium: 30000, premium: 35000 });
    }
    return NextResponse.json(price, { status: 200 });
  } catch (error) {
    console.error('Get prices error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Verify admin access
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();
    if (
      !data.standard ||
      !data.medium ||
      !data.premium ||
      isNaN(data.standard) ||
      isNaN(data.medium) ||
      isNaN(data.premium)
    ) {
      return NextResponse.json({ error: 'Invalid price data' }, { status: 400 });
    }

    let price = await Price.findOne();
    if (!price) {
      price = new Price(data);
    } else {
      price.standard = parseInt(data.standard);
      price.medium = parseInt(data.medium);
      price.premium = parseInt(data.premium);
      price.updatedAt = new Date();
    }
    await price.save();

    // Get price data to emit
    const priceData = {
      standard: price.standard,
      medium: price.medium,
      premium: price.premium
    };

    // Emit Socket.io event - using pricesUpdated to match client listeners
    const io = getIO();
    if (io) {
      console.log('[API] Broadcasting price update via Socket.IO:', priceData);
      io.to('public').emit('pricesUpdated', priceData);
    } else {
      console.warn('[API] Socket.IO instance not available, price update not broadcasted');
    }

    return NextResponse.json(price, { status: 200 });
  } catch (error) {
    console.error('Update prices error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}