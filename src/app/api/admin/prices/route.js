export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import Price from '@/lib/db/models/Price';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET() {
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

    // Emit Socket.io event
    const io = getIO();
    io.to('public').emit('priceUpdate', price);

    return NextResponse.json({ message: 'Prices updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update prices error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}