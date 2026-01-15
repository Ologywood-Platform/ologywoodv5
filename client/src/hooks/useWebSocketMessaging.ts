import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService } from '@/utils/websocket';

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface TypingStatus {
  userId: number;
  userName: string;
  isTyping: boolean;
}

export function useWebSocketMessaging(userId: number | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingStatus>>(new Map());
  const unsubscribeRef = useRef<Array<() => void>>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const initializeConnection = async () => {
      try {
        await websocketService.connect(userId);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    initializeConnection();

    // Subscribe to connection changes
    const unsubscribeConnection = websocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });
    unsubscribeRef.current.push(unsubscribeConnection);

    // Subscribe to incoming messages
    const unsubscribeMessages = websocketService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });
    unsubscribeRef.current.push(unsubscribeMessages);

    // Subscribe to typing notifications
    const unsubscribeTyping = websocketService.onTyping((typingData) => {
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        if (typingData.isTyping) {
          updated.set(typingData.userId, typingData);
        } else {
          updated.delete(typingData.userId);
        }
        return updated;
      });
    });
    unsubscribeRef.current.push(unsubscribeTyping);

    return () => {
      // Cleanup subscriptions
      unsubscribeRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRef.current = [];
      websocketService.disconnect();
    };
  }, [userId]);

  // Send a message
  const sendMessage = useCallback(
    (message: Message) => {
      if (!isConnected) {
        console.warn('WebSocket not connected');
        return;
      }
      websocketService.sendMessage(message);
    },
    [isConnected]
  );

  // Notify typing status
  const notifyTyping = useCallback(
    (userName: string, isTyping: boolean) => {
      if (!isConnected || !userId) return;
      websocketService.notifyTyping(userId, userName, isTyping);
    },
    [isConnected, userId]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Get typing users list
  const getTypingUsers = useCallback(() => {
    return Array.from(typingUsers.values());
  }, [typingUsers]);

  return {
    isConnected,
    messages,
    typingUsers: getTypingUsers(),
    sendMessage,
    notifyTyping,
    clearMessages,
  };
}
