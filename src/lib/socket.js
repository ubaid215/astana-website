import { Server } from 'socket.io';

let io;
let isInitializing = false;

export function initSocket(server) {
  console.log('[Socket.io] Initializing Socket.IO server');

  if (!server || typeof server.listen !== 'function') {
    console.error('[Socket.io] Invalid server object provided');
    return null;
  }

  if (io) {
    console.log('[Socket.io] Server already initialized');
    return io;
  }

  if (isInitializing) {
    console.log('[Socket.io] Initialization already in progress');
    return null;
  }

  isInitializing = true;

  try {
    // Get the origin from environment variable or use a default
    const corsOrigin = process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NODE_ENV === 'production' ?
        'https://www.khanqahsaifia.com' : 'http://localhost:3000');

    console.log('[Socket.io] CORS origin:', corsOrigin);

    io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: [corsOrigin, 'https://www.khanqahsaifia.com'], 
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingInterval: 10000,
      pingTimeout: 5000,
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    // Connection logging
    io.engine.on('connection_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message, err.context);
    });

    io.on('connection', (socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id} from ${socket.handshake.headers.origin}`);

      socket.on('join', (room) => {
        console.log(`[Socket.io] ${socket.id} joined room: ${room}`);
        socket.join(room);
      });

      socket.on('error', (error) => {
        console.error(`[Socket.io] Socket error for ${socket.id}:`, error);
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}. Reason: ${reason}`);
      });
    });

    console.log('[Socket.io] Server initialized successfully');
    isInitializing = false;
    return io;
  } catch (error) {
    console.error('[Socket.io] Initialization failed:', error);
    isInitializing = false;
    return null;
  }
}

export function getIO() {
  if (typeof window === 'undefined') {
    if (!global.io) {
      console.warn('[Socket.io] getIO called but no server instance found');
    }
    return global.io || null;
  }
  console.warn('[Socket.io] getIO called on client-side - returning null');
  return null;
}