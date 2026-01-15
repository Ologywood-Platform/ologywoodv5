// WebSocket service for real-time messaging
// This is a simplified implementation that demonstrates real-time capabilities
// In production, you would use Socket.IO or similar library

type MessageListener = (message: {
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}) => void;

type TypingListener = (data: {
  userId: number;
  userName: string;
  isTyping: boolean;
}) => void;

type ConnectionListener = (connected: boolean) => void;

class WebSocketService {
  private listeners: Map<string, Set<Function>> = new Map();
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners() {
    this.listeners.set('message', new Set());
    this.listeners.set('typing', new Set());
    this.listeners.set('connection', new Set());
  }

  // Simulate WebSocket connection
  connect(userId: number): Promise<void> {
    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        console.log('[WebSocket] Connected');
        resolve();
      }, 500);
    });
  }

  disconnect(): void {
    this.connected = false;
    this.notifyConnectionListeners(false);
    console.log('[WebSocket] Disconnected');
  }

  // Send a real-time message
  sendMessage(message: {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    timestamp: Date;
    read: boolean;
  }): void {
    if (!this.connected) {
      console.warn('[WebSocket] Not connected, message queued');
      return;
    }

    // Simulate sending message
    console.log('[WebSocket] Sending message:', message);
    
    // Broadcast to listeners
    this.notifyMessageListeners(message);
  }

  // Notify typing status
  notifyTyping(userId: number, userName: string, isTyping: boolean): void {
    if (!this.connected) return;

    const typingData = { userId, userName, isTyping };
    console.log('[WebSocket] Typing notification:', typingData);
    this.notifyTypingListeners(typingData);
  }

  // Subscribe to incoming messages
  onMessage(callback: MessageListener): () => void {
    const listeners = this.listeners.get('message') || new Set();
    listeners.add(callback);
    this.listeners.set('message', listeners);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }

  // Subscribe to typing notifications
  onTyping(callback: TypingListener): () => void {
    const listeners = this.listeners.get('typing') || new Set();
    listeners.add(callback);
    this.listeners.set('typing', listeners);

    return () => {
      listeners.delete(callback);
    };
  }

  // Subscribe to connection status
  onConnectionChange(callback: ConnectionListener): () => void {
    const listeners = this.listeners.get('connection') || new Set();
    listeners.add(callback);
    this.listeners.set('connection', listeners);

    return () => {
      listeners.delete(callback);
    };
  }

  private notifyMessageListeners(message: any): void {
    const listeners = this.listeners.get('message');
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          (callback as MessageListener)(message);
        } catch (error) {
          console.error('[WebSocket] Error in message listener:', error);
        }
      });
    }
  }

  private notifyTypingListeners(data: any): void {
    const listeners = this.listeners.get('typing');
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          (callback as TypingListener)(data);
        } catch (error) {
          console.error('[WebSocket] Error in typing listener:', error);
        }
      });
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    const listeners = this.listeners.get('connection');
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          (callback as ConnectionListener)(connected);
        } catch (error) {
          console.error('[WebSocket] Error in connection listener:', error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Simulate reconnection logic
  private attemptReconnect(userId: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WebSocket] Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(userId).catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
        this.attemptReconnect(userId);
      });
    }, delay);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
