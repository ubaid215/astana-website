export const dynamic = 'force-dynamic';

import connectDB from '@/lib/db/mongodb';
import Slot from '@/lib/db/models/Slot';
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
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
      try {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Constants for layout
        const pageSize = { width: 595, height: 842 }; // A4 size
        const margin = 40;
        const lineHeight = 16;
        const fontSize = { 
          header: 18, 
          subHeader: 14, 
          tableHeader: 10, 
          text: 9,
          participant: 8 
        };
        
        // Column widths (adjusted: removed Country, redistributed space)
        const colWidths = [120, 80, 330]; // Time Slot, Cow Quality, Participant Names
        const colSpacing = 5;
        const tablePadding = 4;
        const participantLineHeight = 12;
        const maxParticipants = 7; // Fixed number of participant rows

        // Initialize page
        let page = pdfDoc.addPage([pageSize.width, pageSize.height]);
        let y = pageSize.height - margin - 30;
        let pageNumber = 1;

        // Helper functions
        const addNewPage = () => {
          page.drawText(`Page ${pageNumber}`, {
            x: pageSize.width - margin - 30,
            y: margin - 15,
            size: fontSize.text,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
          page = pdfDoc.addPage([pageSize.width, pageSize.height]);
          y = pageSize.height - margin - 30;
          pageNumber++;
          return page;
        };

        const cleanText = (text) => {
          return text != null ? text.toString().trim() : '';
        };

        // Modified to extract participant names with proper formatting
        const getParticipantNames = (participants) => {
          if (!participants || !Array.isArray(participants)) return Array(maxParticipants).fill('');
          
          // Flatten all participant names from all participation records
          const allNames = participants
            .flatMap(p => p.participantNames || [])
            .filter(name => name && typeof name === 'string')
            .map(name => cleanText(name));
          
          // Fill to 7 participants (empty strings if fewer than 7)
          const filledNames = [...allNames];
          while (filledNames.length < maxParticipants) {
            filledNames.push('');
          }
          
          return filledNames.slice(0, maxParticipants);
        };

        // Add report title
        page.drawText('Slots Report', {
          x: margin,
          y,
          size: fontSize.header,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        // Add generation date
        const date = new Date().toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'numeric', 
          year: 'numeric' 
        });
        page.drawText(`Generated on: ${date}`, {
          x: margin,
          y: y - 20,
          size: fontSize.subHeader,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 40;

        // Group slots by day
        const slotsByDay = slots.reduce((acc, slot) => {
          const day = slot.day || 'Unknown';
          if (!acc[day]) acc[day] = [];
          acc[day].push(slot);
          return acc;
        }, {});

        // Process each day
        for (const [day, daySlots] of Object.entries(slotsByDay).sort(([a], [b]) => Number(a) - Number(b))) {
          // Check if we need a new page before adding day header
          if (y - 60 < margin) {
            addNewPage();
          }

          // Add day header
          page.drawText(`Day ${day}:`, {
            x: margin,
            y,
            size: fontSize.subHeader,
            font: boldFont,
            color: rgb(0, 0, 0),
          });
          y -= 25;

          // Define table headers
          const headers = ['Time Slot', 'Cow Quality', 'Participant Names'];
          const colPositions = [margin];
          for (let i = 1; i < colWidths.length; i++) {
            colPositions.push(colPositions[i - 1] + colWidths[i - 1] + colSpacing);
          }

          // Draw table headers
          headers.forEach((header, i) => {
            page.drawRectangle({
              x: colPositions[i],
              y: y - 2,
              width: colWidths[i],
              height: lineHeight,
              color: rgb(0.9, 0.9, 0.9),
              borderWidth: 0.5,
              borderColor: rgb(0.2, 0.2, 0.2),
            });
            page.drawText(header, {
              x: colPositions[i] + tablePadding,
              y: y + 2,
              size: fontSize.tableHeader,
              font: boldFont,
              color: rgb(0, 0, 0),
            });
          });
          y -= lineHeight + 2;

          // Draw table rows for each slot
          for (const slot of daySlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))) {
            // Check if we need a new page before adding this slot
            const slotHeight = (maxParticipants * participantLineHeight) + 4;
            if (y - slotHeight < margin) {
              addNewPage();
              // Redraw day header if we're continuing on a new page
              page.drawText(`Day ${day}:`, {
                x: margin,
                y,
                size: fontSize.subHeader,
                font: boldFont,
                color: rgb(0, 0, 0),
              });
              y -= 25;
              // Redraw table headers
              headers.forEach((header, i) => {
                page.drawRectangle({
                  x: colPositions[i],
                  y: y - 2,
                  width: colWidths[i],
                  height: lineHeight,
                  color: rgb(0.9, 0.9, 0.9),
                  borderWidth: 0.5,
                  borderColor: rgb(0.2, 0.2, 0.2),
                });
                page.drawText(header, {
                  x: colPositions[i] + tablePadding,
                  y: y + 2,
                  size: fontSize.tableHeader,
                  font: boldFont,
                  color: rgb(0, 0, 0),
                });
              });
              y -= lineHeight + 2;
            }

            // Get slot data
            const timeSlot = cleanText(slot.timeSlot) || '-';
            const cowQuality = cleanText(slot.cowQuality) || '-';
            const participants = getParticipantNames(slot.participants);

            // Draw the slot row (spanning multiple lines for participants)
            // Draw cell borders
            page.drawRectangle({
              x: colPositions[0],
              y: y - slotHeight,
              width: colWidths[0],
              height: slotHeight,
              borderWidth: 0.5,
              borderColor: rgb(0.2, 0.2, 0.2),
            });
            page.drawRectangle({
              x: colPositions[1],
              y: y - slotHeight,
              width: colWidths[1],
              height: slotHeight,
              borderWidth: 0.5,
              borderColor: rgb(0.2, 0.2, 0.2),
            });
            page.drawRectangle({
              x: colPositions[2],
              y: y - slotHeight,
              width: colWidths[2],
              height: slotHeight,
              borderWidth: 0.5,
              borderColor: rgb(0.2, 0.2, 0.2),
            });

            // Fill Time Slot and Cow Quality cells (centered vertically)
            page.drawText(timeSlot, {
              x: colPositions[0] + tablePadding,
              y: y - (slotHeight / 2) - (fontSize.text / 2),
              size: fontSize.text,
              font,
              color: rgb(0, 0, 0),
            });
            page.drawText(cowQuality, {
              x: colPositions[1] + tablePadding,
              y: y - (slotHeight / 2) - (fontSize.text / 2),
              size: fontSize.text,
              font,
              color: rgb(0, 0, 0),
            });

            // Fill Participant Names (one per line)
            participants.forEach((name, i) => {
              page.drawText(name || '', {
                x: colPositions[2] + tablePadding,
                y: y - (i * participantLineHeight) - participantLineHeight,
                size: fontSize.participant,
                font,
                color: rgb(0, 0, 0),
              });
            });

            y -= slotHeight + 2;
          }

          // Add extra space between days
          y -= 15;
        }

        // Add final page number
        page.drawText(`Page ${pageNumber}`, {
          x: pageSize.width - margin - 30,
          y: margin - 15,
          size: fontSize.text,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });

        const pdfBytes = await pdfDoc.save();
        return new NextResponse(pdfBytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=slots-report.pdf',
          },
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        return NextResponse.json(
          { error: 'Failed to generate PDF', details: error.message },
          { status: 500 }
        );
      }
    }

    if (format === 'csv') {
      const csvData = slots.map((slot) => ({
        Day: slot.day != null ? slot.day.toString() : '',
        TimeSlot: slot.timeSlot || '',
        CowQuality: slot.cowQuality != null ? slot.cowQuality.toString() : '',
        ParticipantNames: getParticipantNames(slot.participants).join(', '),
      }));

      const csv = Papa.unparse(csvData, {
        quotes: true,
        delimiter: ',',
        header: true,
      });
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=slots-report.csv',
        },
      });
    }

    if (format === 'xlsx') {
      try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Slots');

        worksheet.columns = [
          { header: 'Day', key: 'day', width: 10 },
          { header: 'Time Slot', key: 'timeSlot', width: 15 },
          { header: 'Cow Quality', key: 'cowQuality', width: 15 },
          { header: 'Participant Names', key: 'participantNames', width: 30 },
        ];

        slots.forEach(slot => {
          worksheet.addRow({
            day: slot.day != null ? slot.day.toString() : '',
            timeSlot: slot.timeSlot || '',
            cowQuality: slot.cowQuality != null ? slot.cowQuality.toString() : '',
            participantNames: getParticipantNames(slot.participants).join(', '),
          });
        });

        worksheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D3D3D3' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } },
              };
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            });
          }

          row.eachCell((cell) => {
            const value = cell.value ? cell.value.toString() : '';
            const currentWidth = worksheet.columns[colNumber - 1].width;
            const textWidth = Math.min(50, Math.max(currentWidth, value.length + 2));
            worksheet.columns[colNumber - 1].width = Math.max(currentWidth, textWidth);
          });
        });

        const xlsxBuffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(xlsxBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=slots-report.xlsx',
          },
        });
      } catch (error) {
        console.error('XLSX generation error:', error);
        return NextResponse.json(
          { error: 'Failed to generate XLSX', details: error.message },
          { status: 500 }
        );
      }
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