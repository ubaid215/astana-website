export const dynamic = 'force-dynamic'

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
        // Create a new PDFDocument
        const pdfDoc = await PDFDocument.create();
        let font, boldFont;
        try {
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        } catch (error) {
          throw new Error('Failed to embed fonts: ' + error.message);
        }

        // Constants
        const pageSize = { width: 595, height: 842 }; // A4 size in points
        const margin = 40;
        const lineHeight = 18;
        const fontSize = { header: 16, tableHeader: 11, text: 9 };
        const minColWidth = 80;
        const maxColWidth = 150;
        const colSpacing = 10;

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
          return text != null ? text.toString().replace(/[\n\r]+/g, ' ').trim() : '-';
        };

        const wrapText = (text, maxWidth, font, size) => {
          const cleanedText = cleanText(text);
          const words = cleanedText.split(' ');
          let lines = [];
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, size);
            if (width <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines;
        };

        // Process participants to extract correct field
        const getParticipantsString = (participants) => {
          if (!participants || !Array.isArray(participants)) return '-';
          const names = participants.map(p => {
            if (typeof p === 'string') return p;
            if (p.collectorName) return p.collectorName;
            if (p.members && Array.isArray(p.members)) return p.members.join(', ');
            return '-';
          }).filter(name => name && name !== '-');
          return names.length > 0 ? names.join(', ') : '-';
        };

        // Calculate dynamic column widths
        const headers = ['Day', 'Time Slot', 'Cow Quality', 'Participants'];
        const colWidths = headers.map(() => minColWidth);
        slots.forEach((slot, index) => {
          const row = [
            slot.day != null ? slot.day.toString() : '-',
            slot.timeSlot || '-',
            slot.cowQuality != null ? slot.cowQuality.toString() : '-',
            getParticipantsString(slot.participants),
          ];
          row.forEach((cell, i) => {
            try {
              const cleanedCell = cleanText(cell);
              const textWidth = font.widthOfTextAtSize(cleanedCell, fontSize.text);
              const headerWidth = font.widthOfTextAtSize(headers[i], fontSize.tableHeader);
              colWidths[i] = Math.min(maxColWidth, Math.max(colWidths[i], textWidth, headerWidth));
            } catch (error) {
              console.error(`Error calculating width for column ${headers[i]} at slot index ${index}:`, {
                cellValue: cell,
                cellType: typeof cell,
                error: error.message,
              });
              throw error;
            }
          });
        });

        // Adjust column widths to fit page
        const totalContentWidth = colWidths.reduce((sum, w) => sum + w, 0) + (colWidths.length - 1) * colSpacing;
        let scaleFactor = 1;
        if (totalContentWidth > pageSize.width - 2 * margin) {
          scaleFactor = (pageSize.width - 2 * margin) / totalContentWidth;
          colWidths.forEach((_, i) => {
            colWidths[i] = Math.max(minColWidth, colWidths[i] * scaleFactor);
          });
        }

        // Calculate column positions
        const colPositions = [margin];
        for (let i = 1; i < colWidths.length; i++) {
          colPositions.push(colPositions[i - 1] + colWidths[i - 1] + colSpacing);
        }

        // Add header
        page.drawText('Slots Report', {
          x: margin,
          y,
          size: fontSize.header,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        // Add date
        const date = new Date().toLocaleDateString();
        page.drawText(`Generated on: ${date}`, {
          x: margin,
          y: y - 15,
          size: fontSize.text,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 40;

        // Draw headers
        const drawHeaders = () => {
          headers.forEach((header, i) => {
            page.drawRectangle({
              x: colPositions[i] - colSpacing / 2,
              y: y - 2,
              width: colWidths[i] + colSpacing,
              height: lineHeight,
              borderWidth: 1,
              borderColor: rgb(0.2, 0.2, 0.2),
              color: rgb(0.95, 0.95, 0.95),
            });
            page.drawText(header, {
              x: colPositions[i] + 4,
              y: y + 3,
              size: fontSize.tableHeader,
              font: boldFont,
              color: rgb(0, 0, 0),
            });
          });
        };
        drawHeaders();
        y -= lineHeight;

        // Add header line
        page.drawLine({
          start: { x: margin, y: y + 5 },
          end: { x: pageSize.width - margin, y: y + 5 },
          thickness: 1,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 10;

        // Add table rows
        for (const slot of slots) {
          const row = [
            slot.day != null ? slot.day.toString() : '-',
            slot.timeSlot || '-',
            slot.cowQuality != null ? slot.cowQuality.toString() : '-',
            getParticipantsString(slot.participants),
          ];

          let maxLines = 1;
          row.forEach((cell, i) => {
            const lines = wrapText(cell, colWidths[i], font, fontSize.text);
            maxLines = Math.max(maxLines, lines.length);
          });

          if (y - (maxLines * lineHeight) < margin + 20) {
            page.drawLine({
              start: { x: margin, y: y + 10 },
              end: { x: pageSize.width - margin, y: y + 10 },
              thickness: 0.5,
              color: rgb(0.7, 0.7, 0.7),
            });
            addNewPage();
            drawHeaders();
            y -= lineHeight;
            page.drawLine({
              start: { x: margin, y: y + 5 },
              end: { x: pageSize.width - margin, y: y + 5 },
              thickness: 1,
              color: rgb(0.2, 0.2, 0.2),
            });
            y -= 10;
          }

          row.forEach((cell, i) => {
            const lines = wrapText(cell, colWidths[i], font, fontSize.text);
            lines.forEach((line, lineIndex) => {
              page.drawText(line, {
                x: colPositions[i],
                y: y - (lineIndex * lineHeight),
                size: fontSize.text,
                font,
                color: rgb(0, 0, 0),
              });
            });
          });

          colPositions.forEach((x, i) => {
            page.drawLine({
              start: { x: x - colSpacing / 2, y: y + 10 },
              end: { x: x - colSpacing / 2, y: y - (maxLines * lineHeight) },
              thickness: 0.5,
              color: rgb(0.7, 0.7, 0.7),
            });
          });

          page.drawLine({
            start: { x: margin, y: y - (maxLines * lineHeight) + 10 },
            end: { x: pageSize.width - margin, y: y - (maxLines * lineHeight) + 10 },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          });

          y -= maxLines * lineHeight;
        }

        page.drawLine({
          start: { x: margin, y: y + 10 },
          end: { x: pageSize.width - margin, y: y + 10 },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });

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
        Participants: getParticipantsString(slot.participants),
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
          { header: 'Day', key: 'day', width: 15 },
          { header: 'Time Slot', key: 'timeSlot', width: 15 },
          { header: 'Cow Quality', key: 'cowQuality', width: 15 },
          { header: 'Participants', key: 'participants', width: 30 },
        ];

        slots.forEach(slot => {
          worksheet.addRow({
            day: slot.day != null ? slot.day.toString() : '',
            timeSlot: slot.timeSlot || '',
            cowQuality: slot.cowQuality != null ? slot.cowQuality.toString() : '',
            participants: getParticipantsString(slot.participants),
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

          row.eachCell((cell, colNumber) => {
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