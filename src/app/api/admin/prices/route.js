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
      price = await Price.create({
        standard: { price: 25000, message: '' },
        medium: { price: 30000, message: '' },
        premium: { price: 35000, message: '' }
      });
    }

    // Transform the data to match expected structure
    const responseData = {
      standard: {
        price: price.standard?.price || price.standard || 25000,
        message: price.standard?.message || ''
      },
      medium: {
        price: price.medium?.price || price.medium || 30000,
        message: price.medium?.message || ''
      },
      premium: {
        price: price.premium?.price || price.premium || 35000,
        message: price.premium?.message || ''
      }
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Get prices error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();
    if (
      !data.standard?.price ||
      !data.medium?.price ||
      !data.premium?.price ||
      isNaN(data.standard.price) ||
      isNaN(data.medium.price) ||
      isNaN(data.premium.price)
    ) {
      return NextResponse.json({ error: 'Invalid price data' }, { status: 400 });
    }

    let price = await Price.findOne();
    if (!price) {
      price = new Price(data);
    } else {
      price.standard = {
        price: parseInt(data.standard.price),
        message: data.standard.message || ''
      };
      price.medium = {
        price: parseInt(data.medium.price),
        message: data.medium.message || ''
      };
      price.premium = {
        price: parseInt(data.premium.price),
        message: data.premium.message || ''
      };
      price.updatedAt = new Date();
    }
    await price.save();

    const priceData = {
      standard: price.standard,
      medium: price.medium,
      premium: price.premium
    };

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

export const dynamic = 'force-dynamic';