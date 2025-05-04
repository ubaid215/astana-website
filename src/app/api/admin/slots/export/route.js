import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const slots = await Slot.find().sort({ day: 1, timeSlot: 1 });
    const format = req.nextUrl.searchParams.get('format') || 'json';

    if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {});

      // Register custom font
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Helvetica-Regular.ttf');
      if (!fs.existsSync(fontPath)) {
        throw new Error('Font file not found');
      }
      doc.registerFont('Helvetica', fontPath);

      // PDF content
      doc.font('Helvetica').fontSize(20).text('Slots Report', { align: 'center' });
      doc.moveDown();

      slots.forEach((slot, index) => {
        doc.fontSize(12).text(`Slot ${index + 1}:`);
        doc.text(`Day: ${slot.day}`);
        doc.text(`Time Slot: ${slot.timeSlot}`);
        doc.text(`Cow Quality: ${slot.cowQuality}`);
        doc.text(`Participants: ${slot.participants.join(', ') || 'None'}`);
        doc.moveDown();
      });

      doc.end();

      const pdfBuffer = Buffer.concat(buffers);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=slots-report.pdf',
        },
      });
    } else if (format === 'csv') {
      const csvData = slots.map((slot) => ({
        Day: slot.day,
        TimeSlot: slot.timeSlot,
        CowQuality: slot.cowQuality,
        Participants: slot.participants.join(', '),
      }));

      const csv = Papa.unparse(csvData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=slots-report.csv',
        },
      });
    }

    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('Export slots error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}