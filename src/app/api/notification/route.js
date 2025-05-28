import connectDB from '@/lib/db/mongodb';
import Notification from '@/lib/db/models/Notification';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Notifications API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('[Notifications API] Fetching unread notifications');

    // Only fetch unread notifications
    const notifications = await Notification.find({ read: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log('[Notifications API] Found notifications:', {
      count: notifications.length,
      unread: notifications.filter(n => !n.read).length,
    });

    // Format notifications to include all screenshots
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      allScreenshots: [
        ...(notification.screenshot ? [notification.screenshot] : []),
        ...(notification.screenshots || []),
      ].filter((screenshot, index, arr) => arr.indexOf(screenshot) === index),
    }));

    return NextResponse.json(formattedNotifications, { status: 200 });
  } catch (error) {
    console.error('[Notifications API] Error fetching notifications:', {
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
      console.error('[Notifications API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { action, notificationId } = body;

    if (action === 'markAllAsRead') {
      console.log('[Notifications API] Deleting all unread notifications');

      const deleteResult = await Notification.deleteMany({ read: false });
      
      console.log('[Notifications API] Deleted notifications:', {
        deletedCount: deleteResult.deletedCount,
      });

      return NextResponse.json({
        message: `${deleteResult.deletedCount} notifications deleted successfully`,
        deletedCount: deleteResult.deletedCount,
      }, { status: 200 });
    } else if (action === 'markAsRead' && notificationId) {
      console.log('[Notifications API] Deleting single notification:', notificationId);

      const deleteResult = await Notification.findByIdAndDelete(notificationId);

      if (!deleteResult) {
        console.error('[Notifications API] Notification not found:', notificationId);
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      console.log('[Notifications API] Deleted single notification:', notificationId);

      return NextResponse.json({
        message: 'Notification deleted successfully',
        deletedId: notificationId,
      }, { status: 200 });
    } else {
      console.error('[Notifications API] Invalid action or missing notificationId:', { action, notificationId });
      return NextResponse.json({
        error: 'Invalid action. Use "markAllAsRead" or "markAsRead" with notificationId',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[Notifications API] Error updating notifications:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.error('[Notifications API] Unauthorized delete attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      console.log('[Notifications API] Deleting all notifications');
      const deleteResult = await Notification.deleteMany({});

      console.log('[Notifications API] Deleted all notifications:', {
        deletedCount: deleteResult.deletedCount,
      });

      return NextResponse.json({
        message: `${deleteResult.deletedCount} notifications deleted`,
        deletedCount: deleteResult.deletedCount,
      }, { status: 200 });
    } else if (notificationId) {
      console.log('[Notifications API] Deleting specific notification:', notificationId);

      const notification = await Notification.findByIdAndDelete(notificationId);

      if (!notification) {
        console.error('[Notifications API] Notification not found:', notificationId);
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      console.log('[Notifications API] Deleted single notification:', notificationId);

      return NextResponse.json({
        message: 'Notification deleted successfully',
        deletedId: notificationId,
      }, { status: 200 });
    } else {
      console.error('[Notifications API] Invalid DELETE request: Missing id or all parameter');
      return NextResponse.json({
        error: 'Either provide notification ID or set all=true to delete all notifications',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[Notifications API] Error deleting notifications:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}