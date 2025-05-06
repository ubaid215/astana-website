import connectDB from '@/lib/db/mongodb'
import Participation from '@/lib/db/models/Participation'
import Papa from 'papaparse'
import { generateUserReportPDF } from '@/components/generatePDF'
import ExcelJS from 'exceljs'

export async function GET(req) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')

  try {
    const participations = await Participation.find().sort({ createdAt: -1 })
    const participationsData = participations.map(doc => doc.toObject())

    if (format === 'pdf') {
      try {
        const pdfBytes = await generateUserReportPDF(participationsData)
        
        return new Response(pdfBytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=user_participations.pdf'
          }
        })
      } catch (error) {
        console.error('PDF generation error:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate PDF',
            details: error.message 
          }), 
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    if (format === 'csv') {
      const csvData = participationsData.map(p => ({
        'Collector Name': p.collectorName,
        'WhatsApp Number': p.whatsappNumber,
        Country: p.country,
        Members: p.members?.join(', ') || '',
        'Total Amount': p.totalAmount || 0
      }))

      const csv = Papa.unparse(csvData, {
        quotes: true,
        delimiter: ',',
        header: true
      })
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=user_participations.csv'
        }
      })
    }

    if (format === 'xlsx') {
      try {
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Participations');

        // Define columns
        worksheet.columns = [
          { header: 'Collector Name', key: 'collectorName', width: 15 },
          { header: 'WhatsApp Number', key: 'whatsappNumber', width: 15 },
          { header: 'Country', key: 'country', width: 15 },
          { header: 'Members', key: 'members', width: 30 },
          { header: 'Total Amount', key: 'totalAmount', width: 15 }
        ];

        // Add data
        participationsData.forEach(p => {
          worksheet.addRow({
            collectorName: p.collectorName,
            whatsappNumber: p.whatsappNumber,
            country: p.country,
            members: p.members?.join(', ') || '',
            totalAmount: p.totalAmount || 0
          });
        });

        // Style headers
        worksheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D3D3D3' } // Light gray background
          };
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Style content cells and auto-adjust column widths
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } }
              };
              cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            });
          }

          // Adjust column widths based on content
          row.eachCell((cell, colNumber) => {
            const value = cell.value ? cell.value.toString() : '';
            const currentWidth = worksheet.columns[colNumber - 1].width;
            const textWidth = Math.min(50, Math.max(currentWidth, value.length + 2));
            worksheet.columns[colNumber - 1].width = Math.max(currentWidth, textWidth);
          });
        });

        // Generate XLSX buffer
        const xlsxBuffer = await workbook.xlsx.writeBuffer();

        return new Response(xlsxBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=user_participations.xlsx'
          }
        });
      } catch (error) {
        console.error('XLSX generation error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate XLSX',
            details: error.message 
          }), 
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid format' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Database error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch data',
        details: error.message 
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}