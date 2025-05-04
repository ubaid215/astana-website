'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [prices, setPrices] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socketInstance = io(process.env.NEXTAUTH_URL || 'http://localhost:3000', {
      path: '/socket.io',
      reconnection: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.io Client] Connected:', socketInstance.id);
      socketInstance.emit('join', 'admin');
      socketInstance.emit('join', 'public');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket.io Client] Connection error:', error.message);
    });

    socketInstance.on('newParticipation', (participation) => {
      console.log('[Socket.io Client] New participation:', participation._id);
      setParticipations((prev) => [participation, ...prev]);
    });

    socketInstance.on('updateSlot', (slot) => {
      console.log('[Socket.io Client] Slot updated:', slot._id);
      setSlots((prev) => {
        const index = prev.findIndex((s) => s._id === slot._id);
        if (index !== -1) {
          return [...prev.slice(0, index), slot, ...prev.slice(index + 1)];
        }
        return [slot, ...prev];
      });
    });

    socketInstance.on('priceUpdate', (newPrices) => {
      console.log('[Socket.io Client] Price updated:', newPrices);
      setPrices(newPrices);
    });

    socketInstance.on('paymentUpdate', (updatedParticipation) => {
      console.log('[Socket.io Client] Payment updated:', updatedParticipation._id);
      setParticipations((prev) => {
        const index = prev.findIndex((p) => p._id === updatedParticipation._id);
        if (index !== -1) {
          return [...prev.slice(0, index), updatedParticipation, ...prev.slice(index + 1)];
        }
        return prev;
      });
    });

    socketInstance.on('paymentSubmission', (notification) => {
      console.log('[Socket.io Client] Payment submission:', notification.participationId);
      setNotifications((prev) => [notification, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      console.log('[Socket.io Client] Disconnecting');
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    participations,
    slots,
    prices,
    notifications,
    setParticipations,
    setSlots,
    setPrices,
    setNotifications,
  };
}