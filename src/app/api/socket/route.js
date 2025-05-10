import { NextResponse } from 'next/server';
import { getIO } from '@/lib/socket';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[API] /api/socket called');
    const io = getIO();
    
    if (!io) {
      console.warn('[API] Socket.IO server not initialized');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Socket.IO server not initialized',
          globalIO: !!global.io,
        }, 
        { status: 503 }
      );
    }

    const clientsCount = io.engine.clientsCount;
    console.log('[API] Socket.IO server running, clients:', clientsCount);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Socket.IO server is running',
      clients: clientsCount,
      globalIO: !!global.io,
    });
  } catch (error) {
    console.error('[API] Error in /api/socket:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}