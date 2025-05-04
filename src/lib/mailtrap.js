import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'bulk.api.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_API_KEY,
    pass: process.env.MAILTRAP_API_KEY,
  },
});

export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.MAILTRAP_SENDER_EMAIL,
    to: email,
    subject: 'Verify Your Email - Eid ul Adha Participation',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/forgot-password?token=${token}`;
  const mailOptions = {
    from: process.env.MAILTRAP_SENDER_EMAIL,
    to: email,
    subject: 'Reset Your Password - Eid ul Adha Participation',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendNewsletterConfirmation(email, token) {
  const confirmUrl = `${process.env.NEXTAUTH_URL}/newsletter/confirm?token=${token}`;
  const mailOptions = {
    from: process.env.MAILTRAP_SENDER_EMAIL,
    to: email,
    subject: 'Confirm Your Newsletter Subscription',
    html: `
      <h1>Newsletter Subscription</h1>
      <p>Click the link below to confirm your subscription:</p>
      <a href="${confirmUrl}">Confirm Subscription</a>
    `,
  };
  await transporter.sendMail(mailOptions);
}