import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'live.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: '"Astana Aliya" <no-reply@astana-aliya.com>',
      to,
      subject,
      text: text || '',
      html: html || '',
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending error:', {
      message: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to send email');
  }
}