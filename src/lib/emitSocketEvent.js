import { getIO } from './socket';

export function emitSocketEvent(event, data, rooms = null) {
  if (!event) {
    console.warn('[Socket] Missing event name in emitSocketEvent');
    return false;
  }

  try {
    const io = getIO();
    
    if (!io) {
      console.warn(`[Socket] Cannot emit ${event}, socket not initialized`);
      return false;
    }
    
    if (rooms) {
      if (Array.isArray(rooms)) {
        rooms.forEach((room) => {
          console.log(`[Socket] Emitting ${event} to room: ${room}`);
          io.to(room).emit(event, data);
        });
      } else {
        console.log(`[Socket] Emitting ${event} to room: ${rooms}`);
        io.to(rooms).emit(event, data);
      }
    } else {
      console.log(`[Socket] Emitting ${event} to all clients`);
      io.emit(event, data);
    }
    
    return true;
  } catch (error) {
    console.error(`[Socket] Error emitting ${event}:`, {
      message: error.message,
      stack: error.stack,
    });
    return false;
  }
}