import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXTAUTH_URL, {
      reconnection: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      socketInstance.emit('join', 'admin');
      socketInstance.emit('join', 'public');
    });

    socketInstance.on('newParticipation', (participation) => {
      setParticipations((prev) => [participation, ...prev]);
    });

    socketInstance.on('updateSlot', (slot) => {
      setSlots((prev) => {
        const index = prev.findIndex((s) => s._id === slot._id);
        if (index !== -1) {
          return [...prev.slice(0, index), slot, ...prev.slice(index + 1)];
        }
        return [slot, ...prev];
      });
    });

    socketInstance.on('priceUpdate', (newPrices) => {
      setPrices(newPrices);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, participations, slots, prices, setParticipations, setSlots, setPrices };
}