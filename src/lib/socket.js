import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  if (io) {
    console.log('[Socket.io] Already initialized');
    return io;
  }

  try {
    io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log('[Socket.io] Client connected:', socket.id);
      socket.join('admin');
      socket.join('public');
      socket.on('join', (room) => {
        console.log(`[Socket.io] Socket ${socket.id} joined room: ${room}`);
        socket.join(room);
      });
      socket.on('disconnect', () => {
        console.log('[Socket.io] Client disconnected:', socket.id);
      });
    });

    console.log('[Socket.io] Initialized with path: /socket.io');
    return io;
  } catch (error) {
    console.error('[Socket.io] Initialization error:', error.message);
    throw error;
  }
}

export function getIO() {
  if (!io) {
    console.warn('[Socket.io] Not initialized yet');
    return null;
  }
  return io;
}