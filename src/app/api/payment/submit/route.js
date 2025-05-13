export const dynamic = 'force-dynamic';

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
    // Authenticate user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      console.error('[Payment API] Unauthorized: No token or sub');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();
    console.log('[Payment API] Database connected');

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      console.log('[Payment API] Creating upload directory:', uploadDir);
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Parse form data
    const formData = await req.formData();
    const participationId = formData.get('participationId');
    const transactionId = formData.get('transactionId');
    const screenshot = formData.get('screenshot');

    // Validate fields
    if (!participationId || !transactionId || !screenshot) {
      return NextResponse.json(
        { error: 'Missing required fields: participationId, transactionId, and screenshot are required' }, 
        { status: 400 }
      );
    }

    // Verify participation belongs to user
    const participation = await Participation.findOne({ _id: participationId, userId: token.sub });
    if (!participation) {
      return NextResponse.json(
        { error: 'Invalid participation or unauthorized access' }, 
        { status: 403 }
      );
    }

    // Check if transactionId is unique
    const existingParticipation = await Participation.findOne({
      transactionId,
      _id: { $ne: participationId },
    });
    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Transaction ID is already used by another participation' }, 
        { status: 400 }
      );
    }

    // Handle file upload
    let screenshotPath = null;
    if (screenshot && screenshot instanceof File) {
      // Validate file type and size
      const mimeType = screenshot.type;
      if (!/image\/(jpeg|png)/.test(mimeType)) {
        return NextResponse.json(
          { error: 'Only JPEG or PNG images are allowed' }, 
          { status: 400 }
        );
      }

      const maxFileSize = 5 * 1024 * 1024;
      if (screenshot.size > maxFileSize) {
        return NextResponse.json(
          { error: 'File size exceeds 5MB limit' }, 
          { status: 400 }
        );
      }

      // Save file
      const extension = path.extname(screenshot.name);
      const newFileName = `${participationId}-${Date.now()}${extension}`;
      const newPath = path.join(uploadDir, newFileName);
      const buffer = Buffer.from(await screenshot.arrayBuffer());
      await fs.writeFile(newPath, buffer);
      screenshotPath = `/uploads/${newFileName}`;
    }

    // Update participation
    participation.transactionId = transactionId;
    participation.screenshot = screenshotPath;
    participation.paymentStatus = 'Pending';
    participation.paymentDate = new Date();
    await participation.save();

    // Get user details
    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Create persistent notification
    const notification = new Notification({
      type: 'payment',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      participationId,
      transactionId,
      amount: participation.totalAmount,
      screenshot: screenshotPath,
      read: false
    });
    await notification.save();

    // Emit Socket.io notification
    const io = getIO();
    if (io) {
      io.to('admin').emit('paymentSubmission', {
        ...notification.toObject(),
        timestamp: new Date()
      });
    }

    return NextResponse.json(
      { 
        message: 'Payment submitted successfully',
        participationId,
        transactionId 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('[Payment API] Error:', error);
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    );
  }
}