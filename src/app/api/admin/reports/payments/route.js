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
\\fancyhead[C]{\\textbf{\\LARGE Eid ul Adha Participation System - Payment Report}}
\\fancyfoot[C]{\\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}

\\newcolumntype{L}[1]{>{\\raggedright\\arraybackslash}p{#1}}
\\setlength{\\parindent}{0pt}

\\begin{document}

\\begin{center}
    \\vspace*{1cm}
    \\textbf{\\Large Payment Report} \\
    \\vspace{0.5cm}
    Generated on: \\today\\ at \\currenttime
\\end{center}

\\vspace{1cm}

\\begin{landscape}
    \\begin{longtable}{L{3cm} L{3cm} L{3cm} L{2cm} L{3cm} L{3cm}}
        \\toprule
        \\textbf{User} & \\textbf{Participation ID} & \\textbf{Amount} & \\textbf{Status} & \\textbf{Transaction ID} & \\textbf{Payment Date} \\
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
      console.log('Unauthorized access to /api/admin/reports/payments');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();

    // Fetch participations with payment details
    const participations = await Participation.find({
      paymentStatus: { $ne: 'Pending' },
    })
      .populate('userId', 'name email')
      .lean();

    // Format data for LaTeX
    const rows = participations
      .map((p) => {
        const user = p.userId ? `${escapeLatex(p.userId.name)} (${escapeLatex(p.userId.email)})` : 'N/A';
        const participationId = escapeLatex(p._id.toString().slice(0, 6)) + '...';
        const amount = p.totalAmount ? p.totalAmount.toLocaleString() : '0';
        const status = escapeLatex(p.paymentStatus || 'N/A');
        const transactionId = escapeLatex(p.transactionId || 'N/A');
        const paymentDate = p.paymentDate
          ? new Date(p.paymentDate).toISOString().split('T')[0]
          : 'N/A';

        return `${user} & ${participationId} & ${amount} & ${status} & ${transactionId} & ${paymentDate} \\\\`;
      })
      .join('\n');

    // Inject data into LaTeX template
    const latexContent = latexTemplate.replace('%DATA%', rows);

    // Write LaTeX file to temporary directory
    const tempDir = path.join(process.cwd(), 'tmp');
    const texFile = path.join(tempDir, 'payment-report.tex');
    const pdfFile = path.join(tempDir, 'payment-report.pdf');
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
        'Content-Disposition': 'attachment; filename=payments-report.pdf',
      },
    });
  } catch (error) {
    console.error('Payment report error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}