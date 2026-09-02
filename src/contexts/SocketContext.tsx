import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinCompetition: (competitionId: string) => void;
  leaveCompetition: (competitionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinCompetition: () => {},
  leaveCompetition: () => {}
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  user: any; // User object from App.tsx
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, user }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) return;

    const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socketBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    const socketInstance = io(socketBaseUrl, {
      path: '/socket.io/',
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const joinCompetition = useCallback((competitionId: string) => {
    socket?.emit('joinCompetition', { competitionId });
  }, [socket]);

  const leaveCompetition = useCallback((competitionId: string) => {
    socket?.emit('leaveCompetition', { competitionId });
  }, [socket]);

  // Stable identity for the context value too, so consumers that depend on it
  // don't re-run for the same reason.
  const value = useMemo(
    () => ({ socket, isConnected, joinCompetition, leaveCompetition }),
    [socket, isConnected, joinCompetition, leaveCompetition]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
