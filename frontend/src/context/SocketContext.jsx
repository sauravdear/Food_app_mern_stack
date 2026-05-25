import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Join store room if applicable
      if (user.assignedStoreId) {
        socket.emit('join:store', user.assignedStoreId);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('transfer:created', ({ transfer }) => {
      toast.success(`New transfer created: ${transfer.transferId}`, { duration: 5000 });
    });

    socket.on('transfer:approved', ({ transferId }) => {
      toast.success(`Transfer approved`, { duration: 4000 });
    });

    socket.on('transfer:statusUpdate', ({ transferId, status }) => {
      toast(`Transfer status → ${status}`, { icon: '📦', duration: 4000 });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
