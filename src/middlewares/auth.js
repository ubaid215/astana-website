import connectDB from '@/lib/db/mongodb';
import Price from '@/lib/db/models/Price';
import { getIO } from '@/lib/socket';

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

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    let price = await Price.findOne();
    if (!price) {
      price = new Price(data);
    } else {
      price.standard = data.standard;
      price.medium = data.medium;
      price.premium = data.premium;
      price.updatedAt = new Date();
    }
    await price.save();

    // Emit Socket.io event
    const io = getIO();
    io.to('public').emit('priceUpdate', price);

    return new Response(JSON.stringify({ message: 'Prices updated' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}