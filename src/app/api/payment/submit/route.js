export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import User from '@/lib/db/models/User';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import fs from 'fs/promises';
import path from 'path';

// Disable bodyParser is not needed, as NextRequest.formData() handles multipart data
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

    // Parse form data with NextRequest.formData()
    const formData = await req.formData();
    const participationId = formData.get('participationId');
    const transactionId = formData.get('transactionId');
    const screenshot = formData.get('screenshot');

    // Log form data
    console.log('[Payment API] Form data received:', {
      participationId,
      transactionId,
      screenshot: screenshot ? screenshot.name : null,
    });

    // Validate fields
    if (!participationId || !transactionId) {
      console.error('[Payment API] Missing fields:', { participationId, transactionId });
      return NextResponse.json({ error: 'Missing participationId or transactionId' }, { status: 400 });
    }

    // Verify participation belongs to user
    const participation = await Participation.findOne({ _id: participationId, userId: token.sub });
    if (!participation) {
      console.error('[Payment API] Invalid participation:', { participationId, userId: token.sub });
      return NextResponse.json({ error: 'Invalid participation' }, { status: 400 });
    }

    // Check if transactionId is unique (excluding current participation)
    const existingParticipation = await Participation.findOne({
      transactionId,
      _id: { $ne: participationId }, // Exclude the current participation
    });
    if (existingParticipation) {
      console.error('[Payment API] Transaction ID already used:', { transactionId, existingParticipationId: existingParticipation._id });
      return NextResponse.json({ error: 'Transaction ID is already used by another participation' }, { status: 400 });
    }

    // Handle file upload
    let screenshotPath = null;
    if (screenshot && screenshot instanceof File) {
      // Validate file type
      const mimeType = screenshot.type;
      if (!/image\/(jpeg|png)/.test(mimeType)) {
        console.error('[Payment API] Invalid file type:', mimeType);
        return NextResponse.json({ error: 'Only JPEG or PNG images are allowed' }, { status: 400 });
      }

      // Validate file size (5MB limit)
      const maxFileSize = 5 * 1024 * 1024;
      if (screenshot.size > maxFileSize) {
        console.error('[Payment API] File too large:', screenshot.size);
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
      }

      // Save file
      const extension = path.extname(screenshot.name);
      const newFileName = `${participationId}-${Date.now()}${extension}`;
      const newPath = path.join(uploadDir, newFileName);
      const buffer = Buffer.from(await screenshot.arrayBuffer());
      console.log('[Payment API] Saving file to:', newPath);
      await fs.writeFile(newPath, buffer);
      screenshotPath = `/uploads/${newFileName}`;
      console.log('[Payment API] Screenshot saved:', screenshotPath);
    }

    // Update participation
    participation.transactionId = transactionId;
    if (screenshotPath) participation.screenshot = screenshotPath;
    participation.updatedAt = new Date();
    await participation.save();
    console.log('[Payment API] Participation updated:', participationId);

    // Emit Socket.io notification
    const user = await User.findById(token.sub);
    const io = getIO();
    if (io) {
      io.to('admin').emit('paymentSubmission', {
        userName: user.name,
        participationId,
        transactionId,
        screenshot: screenshotPath,
        timestamp: new Date(),
      });
      console.log('[Payment API] Socket.io notification emitted:', { participationId });
    } else {
      console.warn('[Payment API] Socket.io not initialized, skipping notification');
    }

    console.log('[Payment API] Payment submitted successfully:', { participationId, transactionId });
    return NextResponse.json({ message: 'Payment details submitted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[Payment API] Payment submission error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}