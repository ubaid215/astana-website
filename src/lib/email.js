import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'live.smtp.mailtrap.io',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export async function sendVerificationEmail(email, token) {
  try {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    const mailOptions = {
      from: `"Eid ul Adha Participation" <${process.env.MAILTRAP_SENDER_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email - Eid ul Adha Participation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #1e3a8a;">Verify Your Email</h1>
          <p>Thank you for registering! Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #15803d; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p style="color: #6b7280;">This link will expire in 24 hours.</p>
        </div>
      `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', {
      message: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(email, token) {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/forgot-password?token=${token}`;
    const mailOptions = {
      from: `"Eid ul Adha Participation" <${process.env.MAILTRAP_SENDER_EMAIL}>`,
      to: email,
      subject: 'Reset Your Password - Eid ul Adha Participation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #1e3a8a;">Reset Your Password</h1>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #15803d; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color: #6b7280;">This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', {
      message: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to send password reset email');
  }
}

export async function sendGenericEmail({ to, subject, text, html }) {
  try {
    const mailOptions = {
      from: `"Eid ul Adha Participation" <${process.env.MAILTRAP_SENDER_EMAIL}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Generic email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending generic email:', {
      message: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to send generic email');
  }
}