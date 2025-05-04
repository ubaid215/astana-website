import connectDB from '@/lib/db/mongodb';
import Price from '@/lib/db/models/Price';

export async function GET() {
  try {
    await connectDB();
    let price = await Price.findOne();
    if (!price) {
      price = await Price.create({ standard: 25000, medium: 30000, premium: 35000 });
    }
    return new Response(JSON.stringify(price), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}