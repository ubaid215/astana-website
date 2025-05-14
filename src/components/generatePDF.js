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
    const lineHeight = 15; // Reduced line height for better spacing
    const fontSize = { header: 16, tableHeader: 10, text: 8 }; // Reduced font sizes
    const minColWidth = 60; // Reduced minimum column width
    const maxColWidth = 120; // Reduced maximum column width
    const colSpacing = 8; // Reduced space between columns
    const contentWidth = pageSize.width - (2 * margin);

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

    // Helper function to wrap text - improved for better handling
    const wrapText = (text, maxWidth, font, size) => {
      if (!text) return ['-'];

      const textStr = text.toString();
      // Handle case with no spaces
      if (!textStr.includes(' ') && font.widthOfTextAtSize(textStr, size) > maxWidth) {
        const chars = textStr.split('');
        let lines = [];
        let currentLine = '';

        for (const char of chars) {
          const testLine = currentLine + char;
          const width = font.widthOfTextAtSize(testLine, size);
          if (width <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = char;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      }

      // Normal space-based wrapping
      const words = textStr.split(' ');
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

    // Define headers and normalize field names
    const headers = ['Collector Name', 'WhatsApp No.', 'Country', 'Cow Quality', 'Participants', 'Total Amount'];
    const fields = ['collectorName', 'whatsappNumber', 'country', 'cowQuality', 'members', 'totalAmount'];

    // Normalize data for easier processing
    const normalizedData = participations.map(p => ({
      collectorName: p.collectorName || '-',
      whatsappNumber: p.whatsappNumber || p.whatsappNo || '-',
      country: p.country || '-',
      cowQuality: p.cowQuality || '-',
      members: p.members ? (Array.isArray(p.members) ? p.members.join(', ') : p.members) : '-',
      totalAmount: p.totalAmount ? p.totalAmount.toLocaleString() : '0'
    }));

    // Calculate optimal column widths based on content
    const colWidths = headers.map(() => minColWidth);

    // First pass: measure all content
    [...headers, ...normalizedData.flatMap(row =>
      fields.map(field => row[field])
    )].forEach((text, i) => {
      const colIndex = i % headers.length;
      const textWidth = font.widthOfTextAtSize(text || '-',
        i < headers.length ? fontSize.tableHeader : fontSize.text);
      colWidths[colIndex] = Math.max(colWidths[colIndex], textWidth + 8); // +8 for padding
    });

    // Cap column widths at maximum
    colWidths.forEach((width, i) => {
      colWidths[i] = Math.min(maxColWidth, width);
    });

    // Calculate total width and adjust proportionally if needed
    let totalWidth = colWidths.reduce((sum, width) => sum + width, 0) + (colWidths.length - 1) * colSpacing;

    if (totalWidth > contentWidth) {
      const scale = contentWidth / totalWidth;
      colWidths.forEach((_, i) => {
        // Scale down but maintain minimum width
        colWidths[i] = Math.max(minColWidth, Math.floor(colWidths[i] * scale));
      });

      // Recalculate total width after scaling
      totalWidth = colWidths.reduce((sum, width) => sum + width, 0) + (colWidths.length - 1) * colSpacing;

      // If still exceeding, reduce the largest columns further
      if (totalWidth > contentWidth) {
        const excess = totalWidth - contentWidth;
        const sortedIndices = colWidths
          .map((width, index) => ({ width, index }))
          .sort((a, b) => b.width - a.width);

        // Distribute excess reduction across largest columns
        let remainingExcess = excess;
        let i = 0;
        while (remainingExcess > 0 && i < sortedIndices.length) {
          const idx = sortedIndices[i].index;
          const reduction = Math.min(remainingExcess, colWidths[idx] - minColWidth);
          colWidths[idx] -= reduction;
          remainingExcess -= reduction;
          i++;
        }
      }
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
        // Draw border rectangle
        page.drawRectangle({
          x: colPositions[i] - 2,
          y: y - lineHeight + 2,
          width: colWidths[i] + 4,
          height: lineHeight + 2,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.2, 0.2),
          color: rgb(0.95, 0.95, 0.95), // Light gray background
        });

        // Center header text in cell
        const textWidth = font.widthOfTextAtSize(header, fontSize.tableHeader);
        const centerX = colPositions[i] + (colWidths[i] - textWidth) / 2;

        page.drawText(header, {
          x: centerX,
          y: y - lineHeight + 10, // Position for vertical centering
          size: fontSize.tableHeader,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });
    };

    // Draw table headers with borders
    drawHeaders();
    y -= lineHeight + 15;

    // Draw grid borders (vertical)
    const drawVerticalGridLines = (startY, endY) => {
      // First vertical line
      page.drawLine({
        start: { x: margin - 2, y: startY },
        end: { x: margin - 2, y: endY },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Column dividers
      colPositions.forEach((x, i) => {
        if (i > 0) { // Skip the first one as it's already drawn
          page.drawLine({
            start: { x: x - colSpacing / 2, y: startY },
            end: { x: x - colSpacing / 2, y: endY },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          });
        }
      });

      // Last vertical line
      page.drawLine({
        start: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: startY },
        end: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: endY },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });
    };

    // Initial table line
    const tableTop = y + lineHeight;
    page.drawLine({
      start: { x: margin - 2, y: tableTop },
      end: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: tableTop },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Track table bottom for final horizontal line
    let tableBottom = y;

    // Add table rows
    for (const row of normalizedData) {
      // Get all text wrapped for each cell
      const wrappedCells = fields.map((field, i) =>
        wrapText(row[field], colWidths[i], font, fontSize.text)
      );

      // Calculate row height based on maximum lines in any cell
      const maxLines = Math.max(...wrappedCells.map(lines => lines.length));
      const rowHeight = maxLines * lineHeight;

      // Check if we need a new page
      if (y - rowHeight < margin + 20) {
        // Complete the current page table
        tableBottom = y;
        drawVerticalGridLines(tableTop, tableBottom);

        // Bottom border
        page.drawLine({
          start: { x: margin - 2, y: tableBottom },
          end: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: tableBottom },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Add page number
        page.drawText(`Page ${pageNumber}`, {
          x: pageSize.width - margin - 30,
          y: margin - 15,
          size: fontSize.text,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Add new page
        addNewPage();

        // Table title for continuation
        page.drawText('Qurbani Participations List (continued)', {
          x: margin,
          y,
          size: fontSize.header,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= 30;

        // Redraw headers on new page
        drawHeaders();
        y -= lineHeight + 5;
        tableTop = y + lineHeight;

        // Top border for new page
        page.drawLine({
          start: { x: margin - 2, y: tableTop },
          end: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: tableTop },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // Draw row horizontal separator
      page.drawLine({
        start: { x: margin - 2, y: y },
        end: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Draw cell content
      wrappedCells.forEach((lines, colIndex) => {
        lines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: colPositions[colIndex] + 2, // Add padding
            y: y - (lineIndex * lineHeight) - 10, // Position based on line index
            size: fontSize.text,
            font,
            color: rgb(0, 0, 0),
          });
        });
      });

      // Move down by row height
      y -= rowHeight;
      tableBottom = y;
    }

    // Draw final table grid
    drawVerticalGridLines(tableTop, tableBottom);

    // Draw final horizontal line
    page.drawLine({
      start: { x: margin - 2, y: tableBottom },
      end: { x: colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1] + 2, y: tableBottom },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Draw final page number
    page.drawText(`Page ${pageNumber}`, {
      x: pageSize.width - margin - 30,
      y: margin - 15,
      size: fontSize.text,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Add summary at the end if space permits
    if (y > margin + 60) {
      y -= 30;
      // Count total participants by splitting members field
      const totalParticipants = normalizedData.reduce((sum, row) => {
        const members = row.members && row.members !== '-' ? row.members.split(', ').length : 0;
        return sum + members;
      }, 0);
      page.drawText(`Total Participants: ${totalParticipants}`, {
        x: margin,
        y,
        size: fontSize.tableHeader,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Calculate total amount if possible
      try {
        const totalAmount = normalizedData
          .reduce((sum, row) => sum + parseFloat(row.totalAmount.replace(/,/g, '')), 0)
          .toLocaleString();

        y -= 20;
        page.drawText(`Total Amount: Pkr ${totalAmount}`, {
          x: margin,
          y,
          size: fontSize.tableHeader,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      } catch (error) {
        // Skip if we can't calculate the total amount
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}