import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .limit(50);

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
    await Notification.updateMany({ read: false }, { $set: { read: true } });

    return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}