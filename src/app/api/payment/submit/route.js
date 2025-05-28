import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import User from '@/lib/db/models/User';
import Notification from '@/lib/db/models/Notification';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      console.error('[Payment API] Unauthorized: No token or sub');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('[Payment API] Database connected');

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      console.log('[Payment API] Creating upload directory:', uploadDir);
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const formData = await req.formData();
    const participationId = formData.get('participationId');
    const transactionId = formData.get('transactionId');
    const screenshots = formData.getAll('screenshot'); // Match ProfilePage's FormData key

    console.log('[Payment API] FormData entries:', [...formData.entries()]);

    if (!participationId || !transactionId || !screenshots || screenshots.length === 0) {
      console.error('[Payment API] Missing required fields', {
        participationId,
        transactionId,
        screenshotsCount: screenshots?.length || 0,
      });
      return NextResponse.json(
        { error: 'Missing required fields: participationId, transactionId, and at least one screenshot are required' },
        { status: 400 }
      );
    }

    const participation = await Participation.findOne({
      _id: participationId,
      userId: token.sub,
    });

    if (!participation) {
      console.error('[Payment API] Invalid participation or unauthorized', {
        participationId,
        userId: token.sub,
      });
      return NextResponse.json(
        { error: 'Invalid participation or unauthorized access' },
        { status: 403 }
      );
    }

    const existingParticipation = await Participation.findOne({
      'paymentSubmissions.transactionId': transactionId,
    });

    if (existingParticipation) {
      console.error('[Payment API] Duplicate transaction ID', { transactionId });
      return NextResponse.json(
        { error: 'Transaction ID is already used' },
        { status: 400 }
      );
    }

    const screenshotPaths = [];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];

      if (screenshot && screenshot instanceof File && screenshot.size > 0) {
        const mimeType = screenshot.type;
        if (!/image\/(jpeg|png|jpg|webp)/.test(mimeType)) {
          console.error('[Payment API] Invalid file type', { mimeType, index: i });
          return NextResponse.json(
            { error: `Screenshot ${i + 1}: Only JPEG, PNG, JPG, or WebP images are allowed` },
            { status: 400 }
          );
        }

        if (screenshot.size > maxFileSize) {
          console.error('[Payment API] File size exceeds limit', {
            size: screenshot.size,
            index: i,
          });
          return NextResponse.json(
            { error: `Screenshot ${i + 1}: File size exceeds 5MB limit` },
            { status: 400 }
          );
        }

        try {
          const extension = path.extname(screenshot.name) || '.jpg';
          const timestamp = Date.now();
          const newFileName = `${participationId}-${timestamp}-${i}${extension}`;
          const newPath = path.join(uploadDir, newFileName);
          const buffer = Buffer.from(await screenshot.arrayBuffer());

          await fs.writeFile(newPath, buffer);
          const screenshotPath = `/uploads/${newFileName}`;
          screenshotPaths.push(screenshotPath);

          console.log('[Payment API] Screenshot saved', {
            screenshotPath,
            index: i,
            size: screenshot.size,
          });
        } catch (fileError) {
          console.error('[Payment API] File save error', {
            error: fileError.message,
            index: i,
          });
          return NextResponse.json(
            { error: `Failed to save screenshot ${i + 1}` },
            { status: 500 }
          );
        }
      }
    }

    if (screenshotPaths.length === 0) {
      console.error('[Payment API] No valid screenshots processed');
      return NextResponse.json(
        { error: 'No valid screenshots were processed' },
        { status: 400 }
      );
    }

    if (!participation.paymentSubmissions) {
      participation.paymentSubmissions = [];
    }

    const newSubmission = {
      transactionId,
      screenshots: screenshotPaths,
      screenshot: screenshotPaths[0] || null, // For backward compatibility
      submittedAt: new Date(),
    };

    participation.paymentSubmissions.push(newSubmission);
    participation.paymentStatus = 'Pending';
    participation.paymentDate = new Date();
    participation.updatedAt = new Date();

    try {
      await participation.save();
      console.log('[Payment API] Saved participation:', participation.toObject({ virtuals: true }));
    } catch (saveError) {
      console.error('[Payment API] Failed to save participation', {
        error: saveError.message,
        participationId,
        validationErrors: saveError.errors,
      });
      return NextResponse.json(
        { error: 'Failed to save payment submission to database' },
        { status: 500 }
      );
    }

    const user = await User.findById(token.sub);
    if (!user) {
      console.error('[Payment API] User not found', { userId: token.sub });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const notification = new Notification({
      type: 'payment',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      participationId,
      transactionId,
      amount: participation.totalAmount,
      screenshots: screenshotPaths,
      screenshot: screenshotPaths[0] || null, // For backward compatibility
      read: false,
    });

    try {
      await notification.save();
      console.log('[Payment API] Notification created', {
        notificationId: notification._id,
        screenshotsCount: screenshotPaths.length,
      });
    } catch (notificationError) {
      console.error('[Payment API] Failed to create notification', {
        error: notificationError.message,
      });
    }

    const io = getIO();
    if (io) {
      io.to('admin').emit('paymentSubmission', {
        ...notification.toObject(),
        timestamp: new Date(),
      });
      console.log('[Payment API] Socket.io paymentSubmission emitted');
    } else {
      console.warn('[Payment API] Socket.io not initialized');
    }

    return NextResponse.json(
      {
        message: 'Payment submitted successfully',
        participationId,
        transactionId,
        screenshotsCount: screenshotPaths.length,
        screenshots: screenshotPaths,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Payment API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}