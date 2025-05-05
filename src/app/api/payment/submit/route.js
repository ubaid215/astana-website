import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import User from '@/lib/db/models/User';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

// Disable bodyParser for multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    // Authenticate user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      console.error('❌ Unauthorized: No token or sub');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();

    // Parse form data with formidable
    const form = formidable({
      uploadDir: 'public/uploads/',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: ({ mimetype }) => {
        return mimetype && /image\/(jpeg|png)/.test(mimetype);
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Log form data
    console.log('✅ Form data received:', { fields, files });

    // Extract fields
    const participationId = fields.participationId?.[0];
    const transactionId = fields.transactionId?.[0];
    const file = files.screenshot?.[0];

    if (!participationId || !transactionId) {
      console.error('❌ Missing fields:', { participationId, transactionId });
      return NextResponse.json({ error: 'Missing participationId or transactionId' }, { status: 400 });
    }

    // Verify participation belongs to user
    const participation = await Participation.findOne({ _id: participationId, userId: token.sub });
    if (!participation) {
      console.error('❌ Invalid participation:', { participationId, userId: token.sub });
      return NextResponse.json({ error: 'Invalid participation' }, { status: 400 });
    }

    // Handle file upload
    let screenshotPath = null;
    if (file) {
      const newPath = path.join('public/uploads', `${participationId}-${Date.now()}${path.extname(file.originalname)}`);
      await fs.rename(file.filepath, newPath);
      screenshotPath = newPath.replace('public', '');
    }

    // Update participation
    participation.transactionId = transactionId;
    if (screenshotPath) participation.screenshot = screenshotPath;
    participation.updatedAt = new Date();
    await participation.save();

    // Emit Socket.io notification
    const user = await User.findById(token.sub);
    const io = getIO();
    io.to('admin').emit('paymentSubmission', {
      userName: user.name,
      participationId,
      transactionId,
      screenshot: screenshotPath,
      timestamp: new Date(),
    });

    console.log('✅ Payment submitted:', { participationId, transactionId });

    return NextResponse.json({ message: 'Payment details submitted successfully' }, { status: 200 });
  } catch (error) {
    console.error('❌ Payment submission error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}