export const dynamic = 'force-dynamic'

import connectDB from '@/lib/db/mongodb';
import Participation from '@/lib/db/models/Participation';
import Slot from '@/lib/db/models/Slot';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    await connectDB();
    
    const [participations, slots] = await Promise.all([
      Participation.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email'),
      Slot.find().sort({ day: 1, timeSlot: 1 })
    ]);

    return NextResponse.json(
      { participations, slots },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}