export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// LaTeX template (same as provided previously)
const latexTemplate = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{dejavu}
\\usepackage{geometry}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{pdflscape}
\\usepackage{datetime}

\\geometry{margin=1in}

\\definecolor{primary}{HTML}{1e3a8a}
\\definecolor{secondary}{HTML}{15803d}

\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[C]{\\textbf{\\LARGE Eid ul Adha Participation System - Participation Report}}
\\fancyfoot[C]{\\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}

\\newcolumntype{L}[1]{>{\\raggedright\\arraybackslash}p{#1}}
\\setlength{\\parindent}{0pt}

\\begin{document}

\\begin{center}
    \\vspace*{1cm}
    \\textbf{\\Large Participation Report} \\
    \\vspace{0.5cm}
    Generated on: \\today\\ at \\currenttime
\\end{center}

\\vspace{1cm}

\\begin{landscape}
    \\begin{longtable}{L{3cm} L{3cm} L{2cm} L{2cm} L{3cm} L{2cm} L{3cm} L{2cm} L{2cm}}
        \\toprule
        \\textbf{User} & \\textbf{Collector Name} & \\textbf{Cow Quality} & \\textbf{Day} & \\textbf{Time Slot} & \\textbf{Shares} & \\textbf{Total Amount} & \\textbf{Payment Status} & \\textbf{Slot Status} \\
        \\midrule
        \\endhead
        %DATA%
        \\bottomrule
    \\end{longtable}
\\end{landscape}

\\end{document}
`;

// Escape LaTeX special characters
function escapeLatex(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde')
    .replace(/\^/g, '\\textasciicircum')
    .replace(/\\/g, '\\textbackslash');
}

export async function GET(req) {
  try {
    // Authenticate admin
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      console.log('Unauthorized access to /api/admin/reports/participations');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch participations
    const participations = await Participation.find()
      .populate('userId', 'name email')
      .populate('slotId', 'timeSlot day')
      .lean();

    // Format data for LaTeX
    const rows = participations
      .map((p) => {
        const user = p.userId ? `${escapeLatex(p.userId.name)} (${escapeLatex(p.userId.email)})` : 'N/A';
        const collectorName = escapeLatex(p.collectorName || 'N/A');
        const cowQuality = escapeLatex(p.cowQuality || 'N/A');
        const day = p.slotId ? `Day ${p.slotId.day}` : 'N/A';
        const timeSlot = p.slotId ? escapeLatex(p.slotId.timeSlot) : 'Not Assigned';
        const shares = p.shares || 0;
        const totalAmount = p.totalAmount ? p.totalAmount.toLocaleString() : '0';
        const paymentStatus = escapeLatex(p.paymentStatus || 'Pending');
        const slotStatus = p.slotAssigned ? 'Assigned' : 'Not Assigned';

        return `${user} & ${collectorName} & ${cowQuality} & ${day} & ${timeSlot} & ${shares} & ${totalAmount} & ${paymentStatus} & ${slotStatus} \\\\`;
      })
      .join('\n');

    // Inject data into LaTeX template
    const latexContent = latexTemplate.replace('%DATA%', rows);

    // Write LaTeX file to temporary directory
    const tempDir = path.join(process.cwd(), 'tmp');
    const texFile = path.join(tempDir, 'participation-report.tex');
    const pdfFile = path.join(tempDir, 'participation-report.pdf');
    writeFileSync(texFile, latexContent);

    // Generate PDF using latexmk
    try {
      execSync(`latexmk -pdf -output-directory=${tempDir} ${texFile}`, { stdio: 'inherit' });
    } catch (err) {
      console.error('LaTeX compilation error:', err);
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    // Read PDF
    const pdfBuffer = readFileSync(pdfFile);

    // Clean up temporary files
    try {
      execSync(`latexmk -c -output-directory=${tempDir} ${texFile}`);
    } catch (err) {
      console.warn('Failed to clean up LaTeX files:', err);
    }

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=participations-report.pdf',
      },
    });
  } catch (error) {
    console.error('Participation report error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}