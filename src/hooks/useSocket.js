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

    if (socket) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    console.log('[Socket.io] Connecting to:', socketUrl);

    const socketInstance = io(socketUrl, {
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      transports: [ 'polling', 'websocket'],
      withCredentials: true,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.io] Connected with transport:', socketInstance.io.engine.transport.name);
      setConnected(true);
      socketInstance.emit('join', 'admin');
      socketInstance.emit('join', 'public');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[Socket.io] Connection error:', error.message);
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
      setParticipations((prev) => prev.filter((p) => p._id !== deletedId));
    });

    socketInstance.on('participationCreated', (newParticipation) => {
      console.log('[Socket.io] Participation created:', newParticipation);
      setParticipations((prev) => [...prev, newParticipation]);
    });

    socketInstance.on('participationUpdated', (updatedParticipation) => {
      console.log('[Socket.io] Participation updated:', updatedParticipation);
      setParticipations((prev) =>
        prev.map((p) => (p._id === updatedParticipation._id ? updatedParticipation : p))
      );
    });

    socketInstance.on('slotCreated', (newSlot) => {
      console.log('[Socket.io] Slot created:', newSlot);
      setSlots((prev) => [...prev, newSlot]);
    });

    socketInstance.on('slotUpdated', (updatedSlot) => {
      console.log('[Socket.io] Slot updated:', updatedSlot);
      setSlots((prev) => prev.map((s) => (s._id === updatedSlot._id ? updatedSlot : s)));
    });

    socketInstance.on('slotDeleted', (deletedId) => {
      console.log('[Socket.io] Slot deleted:', deletedId);
      setSlots((prev) => prev.filter((s) => s._id !== deletedId));
    });

    socketInstance.on('pricesUpdated', (newPrices) => {
      console.log('[Socket.io] Prices updated:', newPrices);
      setPrices(newPrices);
    });

    socketInstance.on('notification', (notification) => {
      console.log('[Socket.io] Notification received:', notification);
      setNotifications((prev) => [...prev, notification]);
    });

    // Add paymentSubmission listener
    socketInstance.on('paymentSubmission', (notification) => {
      console.log('[Socket.io] Payment submission received:', notification);
      setNotifications((prev) => {
        const newNotifications = [{
          type: 'payment',
          userName: notification.userName,
          participationId: notification.participationId,
          transactionId: notification.transactionId,
          screenshot: notification.screenshot,
          timestamp: new Date(notification.timestamp),
          read: false
        }, ...prev]; // Newest notifications first
        return newNotifications.slice(0, 50); // Limit to 50 notifications
      });
    });

    setSocket(socketInstance);

    return () => {
      console.log('[Socket.io] Cleaning up connection');
      if (socketInstance) {
        socketInstance.off('connect');
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
        socketInstance.disconnect();
      }
      setConnected(false);
    };
  }, [socket]); // Added socket as a dependency here

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