import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';

import { io } from 'socket.io-client';

import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, restaurant } = useAuth();

  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if user exists
    if (!user) return;

    const SOCKET_URL =
      process.env.REACT_APP_SOCKET_URL ||
      'https://foodash-backend-z1cg.onrender.com';

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    // Join room
    socketRef.current.emit('join', {
      userId: user._id,
      role: user.role,
      restaurantId: restaurant?._id,
    });

    // Debug logs
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, restaurant]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);