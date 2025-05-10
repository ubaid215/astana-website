'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/socket';

export default function SocketInitializer() {
  useEffect(() => {
    // Initialize socket connection
    if (socket && !socket.connected) {
      socket.connect();
    }

    return () => {
      // Cleanup on component unmount
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  return null;
}