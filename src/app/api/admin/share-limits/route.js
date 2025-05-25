import connectDB from '@/lib/db/mongodb';
import ShareLimit from '@/lib/db/models/ShareLimit';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    await connectDB();
    let shareLimit = await ShareLimit.findOne();
    if (!shareLimit) {
      shareLimit = await ShareLimit.create({
        standard: 7,
        medium: 7,
        premium: 7,
        participatedShares: { standard: 0, medium: 0, premium: 0 },
        remainingShares: { standard: 7, medium: 7, premium: 7 },
      });
    }

    return NextResponse.json({
      standard: shareLimit.standard,
      medium: shareLimit.medium,
      premium: shareLimit.premium,
      participatedShares: shareLimit.participatedShares,
      remainingShares: shareLimit.remainingShares,
    }, { status: 200 });
  } catch (error) {
    console.error('Get share limits error:', error);
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
      data.standard === undefined || isNaN(data.standard) || data.standard < 0 ||
      data.medium === undefined || isNaN(data.medium) || data.medium < 0 ||
      data.premium === undefined || isNaN(data.premium) || data.premium < 0
    ) {
      return NextResponse.json({ error: 'Invalid share limit data' }, { status: 400 });
    }

    let shareLimit = await ShareLimit.findOne();
    if (!shareLimit) {
      shareLimit = new ShareLimit({
        standard: parseInt(data.standard),
        medium: parseInt(data.medium),
        premium: parseInt(data.premium),
        participatedShares: { standard: 0, medium: 0, premium: 0 },
        remainingShares: {
          standard: parseInt(data.standard),
          medium: parseInt(data.medium),
          premium: parseInt(data.premium),
        },
      });
    } else {
      if (
        data.standard < shareLimit.participatedShares.standard ||
        data.medium < shareLimit.participatedShares.medium ||
        data.premium < shareLimit.participatedShares.premium
      ) {
        return NextResponse.json({ error: 'New limits cannot be less than participated shares' }, { status: 400 });
      }
      shareLimit.standard = parseInt(data.standard);
      shareLimit.medium = parseInt(data.medium);
      shareLimit.premium = parseInt(data.premium);
      shareLimit.remainingShares.standard = parseInt(data.standard) - shareLimit.participatedShares.standard;
      shareLimit.remainingShares.medium = parseInt(data.medium) - shareLimit.participatedShares.medium;
      shareLimit.remainingShares.premium = parseInt(data.premium) - shareLimit.participatedShares.premium;
      shareLimit.updatedAt = new Date();
    }
    await shareLimit.save();

    const shareLimitData = {
      standard: shareLimit.standard,
      medium: shareLimit.medium,
      premium: shareLimit.premium,
      participatedShares: shareLimit.participatedShares,
      remainingShares: shareLimit.remainingShares,
    };

    const io = getIO();
    if (io) {
      console.log('[API] Broadcasting share limit update via Socket.IO:', shareLimitData);
      io.to('public').emit('shareLimitsUpdated', shareLimitData);
    } else {
      console.warn('[API] Socket.IO instance not available, share limit update not broadcasted');
    }

    return NextResponse.json(shareLimitData, { status: 200 });
  } catch (error) {
    console.error('Update share limits error:', {
      message: error.message,
      stack: error.stack,
    });
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Invalid share limit data: ' + error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';