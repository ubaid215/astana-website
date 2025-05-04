import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.join('admin'); // Admin room for targeted updates
    socket.join('public'); // Public room for price updates
    socket.on('join', (room) => {
      socket.join(room);
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}