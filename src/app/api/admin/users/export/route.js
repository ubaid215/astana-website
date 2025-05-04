import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import PDFDocument from 'pdfkit';
import Papa from 'papaparse';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  const participations = await Participation.find().sort({ createdAt: -1 });

  if (format === 'pdf') {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(16).text('User Participations Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    doc.text('Collector Name    WhatsApp Number    Country    Members    Total Amount', { underline: true });
    doc.moveDown(0.5);

    participations.forEach((p) => {
      doc.text(
        `${p.collectorName.padEnd(20)} ${p.whatsappNumber.padEnd(20)} ${p.country.padEnd(15)} ${p.members.join(', ').padEnd(30)} ${p.totalAmount.toLocaleString()}`,
        { align: 'left' }
      );
      doc.moveDown(0.5);
    });

    doc.end();
    const pdfBuffer = Buffer.concat(buffers);

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=user_participations.pdf',
      },
    });
  } else if (format === 'csv') {
    const csvData = participations.map((p) => ({
      'Collector Name': p.collectorName,
      'WhatsApp Number': p.whatsappNumber,
      Country: p.country,
      Members: p.members.join(', '),
      'Total Amount': p.totalAmount,
    }));

    const csv = Papa.unparse(csvData);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=user_participations.csv',
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid format' }), { status: 400 });
}