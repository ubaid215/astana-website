import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendGenericEmail } from '@/lib/email';

export async function POST(req) {
  try {
    // Verify admin access
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, to, subject, text, html, emailToken } = await req.json();
    if (!type || !to) {
      return NextResponse.json({ error: 'Missing required fields: type and to' }, { status: 400 });
    }

    let result;
    if (type === 'verification') {
      if (!emailToken) {
        return NextResponse.json({ error: 'Missing emailToken for verification' }, { status: 400 });
      }
      result = await sendVerificationEmail(to, emailToken);
    } else if (type === 'password-reset') {
      if (!emailToken) {
        return NextResponse.json({ error: 'Missing emailToken for password reset' }, { status: 400 });
      }
      result = await sendPasswordResetEmail(to, emailToken);
    } else if (type === 'generic') {
      if (!subject || (!text && !html)) {
        return NextResponse.json({ error: 'Missing subject or content for generic email' }, { status: 400 });
      }
      result = await sendGenericEmail({ to, subject, text, html });
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Email sent successfully', messageId: result.messageId }, { status: 200 });
  } catch (error) {
    console.error('Send email error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}