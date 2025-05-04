import connectDB from '@/lib/db/mongodb';
import Newsletter from '@/lib/db/models/Newsletter';
import { sendNewsletterConfirmation } from '@/lib/mailtrap';
import crypto from 'crypto';

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      return new Response(JSON.stringify({ error: 'Email already subscribed' }), { status: 400 });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const subscription = new Newsletter({ email, verificationToken });
    await subscription.save();

    await sendNewsletterConfirmation(email, verificationToken);
    return new Response(JSON.stringify({ message: 'Subscription successful. Please confirm your email.' }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}