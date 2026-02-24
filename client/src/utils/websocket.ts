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

  connect(userId: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        resolve();
      }, 500);
    });
  }

  disconnect(): void {
    this.connected = false;
    this.notifyConnectionListeners(false);
  }

  sendMessage(message: {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    timestamp: Date;
    read: boolean;
  }): void {
    if (!this.connected) return;
    this.notifyMessageListeners(message);
  }

  notifyTyping(userId: number, userName: string, isTyping: boolean): void {
    if (!this.connected) return;
    this.notifyTypingListeners({ userId, userName, isTyping });
  }

  onMessage(callback: MessageListener): () => void {
    const listeners = this.listeners.get('message') || new Set();
    listeners.add(callback);
    this.listeners.set('message', listeners);
    return () => { listeners.delete(callback); };
  }

  onTyping(callback: TypingListener): () => void {
    const listeners = this.listeners.get('typing') || new Set();
    listeners.add(callback);
    this.listeners.set('typing', listeners);
    return () => { listeners.delete(callback); };
  }

  onConnectionChange(callback: ConnectionListener): () => void {
    const listeners = this.listeners.get('connection') || new Set();
    listeners.add(callback);
    this.listeners.set('connection', listeners);
    return () => { listeners.delete(callback); };
  }

  private notifyMessageListeners(message: any): void {
    const listeners = this.listeners.get('message');
    if (listeners) {
      listeners.forEach((callback) => {
        try { (callback as MessageListener)(message); } catch (_) { /* silent */ }
      });
    }
  }

  private notifyTypingListeners(data: any): void {
    const listeners = this.listeners.get('typing');
    if (listeners) {
      listeners.forEach((callback) => {
        try { (callback as TypingListener)(data); } catch (_) { /* silent */ }
      });
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    const listeners = this.listeners.get('connection');
    if (listeners) {
      listeners.forEach((callback) => {
        try { (callback as ConnectionListener)(connected); } catch (_) { /* silent */ }
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private attemptReconnect(userId: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(userId).catch(() => {
        this.attemptReconnect(userId);
      });
    }, delay);
  }
}

export const websocketService = new WebSocketService();
