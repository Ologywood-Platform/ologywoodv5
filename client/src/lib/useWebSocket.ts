import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  userId: number;
  userRole: string;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: number, recipientId: number, content: string) => void;
  onMessageReceived: (callback: (message: any) => void) => void;
  onTypingIndicator: (callback: (data: any) => void) => void;
  onUserOnline: (callback: (data: any) => void) => void;
  onUserOffline: (callback: (data: any) => void) => void;
}

export function useWebSocket({
  userId,
  userRole,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Connect to WebSocket server
    const socket = io(window.location.origin, {
      auth: {
        userId,
        userRole,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to server');
      isConnectedRef.current = true;
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server');
      isConnectedRef.current = false;
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, userRole, enabled]);

  const sendMessage = useCallback(
    (conversationId: number, recipientId: number, content: string) => {
      if (socketRef.current && isConnectedRef.current) {
        socketRef.current.emit('message:send', {
          conversationId,
          recipientId,
          content,
        });
      } else {
        console.warn('[WebSocket] Socket not connected, message not sent');
      }
    },
    []
  );

  const onMessageReceived = useCallback((callback: (message: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message:received', callback);
    }
  }, []);

  const onTypingIndicator = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('typing:indicator', callback);
    }
  }, []);

  const onUserOnline = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user:online', callback);
    }
  }, []);

  const onUserOffline = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user:offline', callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    sendMessage,
    onMessageReceived,
    onTypingIndicator,
    onUserOnline,
    onUserOffline,
  };
}
