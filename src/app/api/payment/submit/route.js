import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import User from '@/lib/db/models/User';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const upload = multer({
  dest: 'public/uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG/PNG images are allowed'));
  },
});

// Middleware to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Parse form data
    const formData = await new Promise((resolve, reject) => {
      upload.single('screenshot')(req, {}, (err) => {
        if (err) return reject(err);
        resolve(req);
      });
    });

    const { participationId, transactionId } = formData.body;
    const file = formData.file;

    if (!participationId || !transactionId) {
      return NextResponse.json({ error: 'Missing participationId or transactionId' }, { status: 400 });
    }

    // Verify participation belongs to user
    const participation = await Participation.findOne({ _id: participationId, userId: token.sub });
    if (!participation) {
      return NextResponse.json({ error: 'Invalid participation' }, { status: 400 });
    }

    // Handle file upload
    let screenshotPath = null;
    if (file) {
      const newPath = path.join('public/uploads', `${participationId}-${Date.now()}${path.extname(file.originalname)}`);
      await fs.rename(file.path, newPath);
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

    return NextResponse.json({ message: 'Payment details submitted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Payment submission error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}