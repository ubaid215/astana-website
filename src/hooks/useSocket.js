'use client';

import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [participations, setParticipations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [prices, setPrices] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      console.log('[Socket.io] Skipping in test environment');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    console.log('[Socket.io] Connecting to:', socketUrl);

    const socketInstance = io(socketUrl, {
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 3000, // Increased for slower retries
      transports: ['websocket', 'polling'], // Prioritize WebSocket
      withCredentials: true,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.io] Connected with transport:', socketInstance.io.engine.transport.name);
      setConnected(true);
      socketInstance.emit('join', 'admin');
      socketInstance.emit('join', 'public');
    });

    socketInstance.on('transport', (transport) => {
      console.log('[Socket.io] Transport changed:', transport.name);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[Socket.io] Connection error:', error.message, error);
      setConnected(false);
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log('[Socket.io] Reconnection attempt:', attempt);
    });

    socketInstance.on('reconnect', () => {
      console.log('[Socket.io] Reconnected successfully');
      setConnected(true);
    });

    socketInstance.on('reconnect_failed', () => {
      console.warn('[Socket.io] Reconnection failed');
      setConnected(false);
    });

    // Application-specific events
    socketInstance.on('participationDeleted', (deletedId) => {
      console.log('[Socket.io] Participation deleted:', deletedId);
      if (deletedId) {
        setParticipations((prev) => prev.filter((p) => p._id !== deletedId));
      }
    });

    socketInstance.on('participationCreated', (newParticipation) => {
      console.log('[Socket.io] Participation created:', newParticipation);
      if (newParticipation && newParticipation._id) {
        setParticipations((prev) => [...prev, newParticipation]);
      }
    });

    socketInstance.on('participationUpdated', (updatedParticipation) => {
      console.log('[Socket.io] Participation updated:', updatedParticipation);
      if (updatedParticipation && updatedParticipation._id) {
        setParticipations((prev) =>
          prev.map((p) => (p._id === updatedParticipation._id ? updatedParticipation : p))
        );
      }
    });

    socketInstance.on('slotCreated', (newSlot) => {
      console.log('[Socket.io] Slot created:', newSlot);
      if (newSlot && newSlot._id) {
        setSlots((prev) => [...prev, newSlot]);
      }
    });

    socketInstance.on('slotUpdated', (updatedSlot) => {
      console.log('[Socket.io] Slot updated:', updatedSlot);
      if (updatedSlot && updatedSlot._id) {
        setSlots((prev) => prev.map((s) => (s._id === updatedSlot._id ? updatedSlot : s)));
      } else {
        console.warn('[Socket.io] Received invalid slot update data:', updatedSlot);
      }
    });

    socketInstance.on('slotDeleted', (deletedData) => {
      console.log('[Socket.io] Slot deleted:', deletedData);
      
      // Handle both string ID and object with slotId
      let deletedId;
      if (typeof deletedData === 'string') {
        deletedId = deletedData;
      } else if (deletedData && deletedData.slotId) {
        deletedId = deletedData.slotId;
      } else if (deletedData && deletedData._id) {
        deletedId = deletedData._id;
      }
      
      if (deletedId) {
        setSlots((prev) => prev.filter((s) => s._id !== deletedId));
      } else {
        console.warn('[Socket.io] Received invalid slot deletion data:', deletedData);
      }
    });

    socketInstance.on('pricesUpdated', (newPrices) => {
      console.log('[Socket.io | Client] Prices updated:', newPrices);
      if (newPrices) {
        setPrices(newPrices);
      }
    });

    socketInstance.on('notification', (notification) => {
      console.log('[Socket.io] Notification received:', notification);
      if (notification) {
        setNotifications((prev) => [...prev, notification]);
      }
    });

    socketInstance.on('paymentSubmission', (notification) => {
      console.log('[Socket.io] Payment submission received:', notification);
      if (notification && notification.userName && notification.participationId) {
        setNotifications((prev) => {
          const newNotifications = [{
            type: 'payment',
            userName: notification.userName,
            participationId: notification.participationId,
            transactionId: notification.transactionId,
            screenshot: notification.screenshot,
            timestamp: new Date(notification.timestamp),
            read: false
          }, ...prev];
          return newNotifications.slice(0, 50);
        });
      }
    });

    // Handle merge-specific events
    socketInstance.on('mergePerformed', (data) => {
      console.log('[Socket.io] Merge performed:', data);
      // Optionally trigger a refresh or handle merge-specific logic
    });

    socketInstance.on('mergeUndone', (data) => {
      console.log('[Socket.io] Merge undone:', data);
      // Optionally trigger a refresh or handle undo-specific logic
    });

    setSocket(socketInstance);

    return () => {
      console.log('[Socket.io] Cleaning up connection');
      socketInstance.off('connect');
      socketInstance.off('transport');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      socketInstance.off('reconnect_attempt');
      socketInstance.off('reconnect');
      socketInstance.off('reconnect_failed');
      socketInstance.off('participationDeleted');
      socketInstance.off('participationCreated');
      socketInstance.off('participationUpdated');
      socketInstance.off('slotCreated');
      socketInstance.off('slotUpdated');
      socketInstance.off('slotDeleted');
      socketInstance.off('pricesUpdated');
      socketInstance.off('notification');
      socketInstance.off('paymentSubmission');
      socketInstance.off('mergePerformed');
      socketInstance.off('mergeUndone');
      socketInstance.disconnect();
      setConnected(false);
    };
  }, []); // Removed socket from dependencies

  const emit = useCallback(
    (event, data) => {
      if (socket && connected) {
        console.log(`[Socket.io] Emitting ${event}:`, data);
        socket.emit(event, data);
        return true;
      }
      console.warn(`[Socket.io] Cannot emit ${event}, socket not connected`);
      return false;
    },
    [socket, connected]
  );

  const reconnect = useCallback(() => {
    if (socket) {
      console.log('[Socket.io] Attempting manual reconnect');
      socket.connect();
    } else {
      console.warn('[Socket.io] Cannot reconnect, socket not initialized');
    }
  }, [socket]);

  return {
    socket,
    connected,
    emit,
    reconnect,
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