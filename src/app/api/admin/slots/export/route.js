import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import PDFDocument from 'pdfkit';
import Papa from 'papaparse';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  const slots = await Slot.find().sort({ day: 1, timeSlot: 1 });

  if (format === 'pdf') {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(16).text('Participation Slots Report', { align: 'center' });
    doc.moveDown();

    let currentDay = null;
    slots.forEach((slot, index) => {
      if (slot.day !== currentDay) {
        currentDay = slot.day;
        doc.addPage();
        doc.fontSize(14).text(`Day ${currentDay}`, { align: 'left' });
        doc.moveDown();
      }

      doc.fontSize(12).text(`Slot ${index + 1}: ${slot.timeSlot} - ${slot.cowQuality} (${slot.country})`, { underline: true });
      doc.moveDown(0.5);

      doc.text('Collector Name    Members    Shares', { underline: true });
      slot.participants.forEach((p) => {
        doc.text(`${p.collectorName.padEnd(20)} ${p.members.join(', ').padEnd(30)} ${p.shares}`);
        doc.moveDown(0.5);
      });
      doc.moveDown();
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=participation_slots.pdf',
      },
    });
  } else if (format === 'csv') {
    const csvData = slots.flatMap((slot, index) =>
      slot.participants.map((p) => ({
        Slot: index + 1,
        Day: slot.day,
        Time: slot.timeSlot,
        Quality: slot.cowQuality,
        Country: slot.country,
        'Collector Name': p.collectorName,
        Members: p.members.join(', '),
        Shares: p.shares,
      }))
    );

    const csv = Papa.unparse(csvData);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=participation_slots.csv',
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid format' }), { status: 400 });
}