import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generateUserReportPDF(participations) {
  try {
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    
    // Set up fonts with error handling
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
    const minColWidth = 80; // Minimum column width
    const maxColWidth = 150; // Maximum column width
    const colSpacing = 10; // Space between columns

    // Initialize page
    let page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    let y = pageSize.height - margin - 30;
    let pageNumber = 1;

    // Helper function to add new page
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

    // Helper function to wrap text
    const wrapText = (text, maxWidth, font, size) => {
      const words = text.toString().split(' ');
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

    // Calculate dynamic column widths based on content
    const headers = ['Collector Name', 'WhatsApp No.', 'Country', 'participants', 'Total Amount'];
    const colWidths = headers.map(() => minColWidth);
    
    // Measure content width for each column
    participations.forEach((participation) => {
      const row = [
        participation.collectorName || '-',
        participation.whatsappNo || '-',
        participation.country || '-',
        participation.members?.join(', ') || '-',
        participation.totalAmount?.toLocaleString() || '0',
      ];
      row.forEach((cell, i) => {
        const textWidth = font.widthOfTextAtSize(cell, fontSize.text);
        const headerWidth = font.widthOfTextAtSize(headers[i], fontSize.tableHeader);
        colWidths[i] = Math.min(
          maxColWidth,
          Math.max(colWidths[i], textWidth, headerWidth)
        );
      });
    });

    // Adjust column widths to fit within page
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
    page.drawText('Qurbani Participations List', {
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

    // Function to draw headers (used for first page and new pages)
    const drawHeaders = () => {
      headers.forEach((header, i) => {
        // Draw border rectangle first
        page.drawRectangle({
          x: colPositions[i] - colSpacing / 2,
          y: y - 2,
          width: colWidths[i] + colSpacing,
          height: lineHeight,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.2, 0.2),
          color: rgb(0.95, 0.95, 0.95), // Light gray background
        });

        // Draw header text after rectangle to ensure it appears on top
        page.drawText(header, {
          x: colPositions[i] + 4, // Increased padding for better centering
          y: y + 3, // Adjusted to vertically center text in box
          size: fontSize.tableHeader,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });
    };

    // Draw table headers with borders
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

    // Add table rows with grid
    for (const participation of participations) {
      const row = [
        participation.collectorName || '-',
        participation.whatsappNumber || '-',
        participation.country || '-',
        participation.members?.join(', ') || '-',
        participation.totalAmount?.toLocaleString() || '0',
      ];

      // Calculate required height for this row
      let maxLines = 1;
      row.forEach((cell, i) => {
        const lines = wrapText(cell, colWidths[i], font, fontSize.text);
        maxLines = Math.max(maxLines, lines.length);
      });

      // Check if we need a new page
      if (y - (maxLines * lineHeight) < margin + 20) {
        // Draw grid lines for previous rows
        page.drawLine({
          start: { x: margin, y: y + 10 },
          end: { x: pageSize.width - margin, y: y + 10 },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
        addNewPage();
        // Redraw headers on new page
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

      // Draw row
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

      // Draw vertical grid lines
      colPositions.forEach((x, i) => {
        page.drawLine({
          start: { x: x - colSpacing / 2, y: y + 10 },
          end: { x: x - colSpacing / 2, y: y - (maxLines * lineHeight) },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.7),
        });
      });

      // Draw horizontal line to separate rows
      page.drawLine({
        start: { x: margin, y: y - (maxLines * lineHeight) + 10 },
        end: { x: pageSize.width - margin, y: y - (maxLines * lineHeight) + 10 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      y -= maxLines * lineHeight;
    }

    // Draw final horizontal grid line
    page.drawLine({
      start: { x: margin, y: y + 10 },
      end: { x: pageSize.width - margin, y: y + 10 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Draw final page number
    page.drawText(`Page ${pageNumber}`, {
      x: pageSize.width - margin - 30,
      y: margin - 15,
      size: fontSize.text,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}