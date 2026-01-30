import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

let db: any = null;

// Initialize db on first use
async function getDatabase() {
  if (!db) {
    db = await getDb();
  }
  return db;
}

interface NotificationPayload {
  type: 'message' | 'payment' | 'booking' | 'alert';
  title: string;
  message: string;
  userId: number;
  actionUrl?: string;
  data?: Record<string, any>;
}

interface UserSocket {
  userId: number;
  socketId: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<number, UserSocket[]> = new Map();

  /**
   * Initialize Socket.io server
   */
  public initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('[Socket.io] Initialized successfully');
    return this.io;
  }

  /**
   * Setup Socket.io middleware for authentication
   */
  private setupMiddleware() {
    if (!this.io) return;

    this.io.use((socket, next) => {
      const userId = socket.handshake.query.userId as string;
      const token = socket.handshake.auth.token as string;

      if (!userId) {
        return next(new Error('Authentication error: Missing user ID'));
      }

      // In production, verify JWT token here
      socket.data.userId = parseInt(userId, 10);
      next();
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId as number;

      console.log(`[Socket.io] User ${userId} connected: ${socket.id}`);

      // Track user socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push({ userId, socketId: socket.id });

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Handle new message
      socket.on('message:send', (data) => {
        this.handleMessageSend(socket, userId, data);
      });

      // Handle message read
      socket.on('message:read', (data) => {
        this.handleMessageRead(socket, userId, data);
      });

      // Handle typing indicator
      socket.on('typing:start', (data) => {
        this.handleTypingStart(socket, userId, data);
      });

      socket.on('typing:stop', (data) => {
        this.handleTypingStop(socket, userId, data);
      });

      // Handle notification read
      socket.on('notification:read', (data) => {
        this.handleNotificationRead(socket, userId, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(userId, socket.id);
      });
    });
  }

  /**
   * Send notification to user
   */
  public async sendNotification(payload: NotificationPayload) {
    if (!this.io) {
      console.error('[Socket.io] Service not initialized');
      return;
    }

    try {
      const database = await getDatabase();
      // Store notification in database
      const notification = await database.insert(notifications).values({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        actionUrl: payload.actionUrl,
        data: payload.data ? JSON.stringify(payload.data) : null,
        read: false,
      });

      // Emit to user's rooms
      this.io.to(`user:${payload.userId}`).emit('notification:new', {
        id: notification[0],
        ...payload,
        timestamp: new Date(),
        read: false,
      });

      console.log(`[Socket.io] Notification sent to user ${payload.userId}`);
    } catch (error) {
      console.error('[Socket.io] Error sending notification:', error);
    }
  }

  /**
   * Send notification to multiple users
   */
  public async broadcastNotification(userIds: number[], payload: Omit<NotificationPayload, 'userId'>) {
    for (const userId of userIds) {
      await this.sendNotification({ ...payload, userId });
    }
  }

  /**
   * Handle message send event
   */
  private handleMessageSend(socket: Socket, userId: number, data: any) {
    const { recipientId, message, bookingId } = data;

    if (!recipientId || !message) {
      socket.emit('error', { message: 'Missing recipient or message' });
      return;
    }

    // Emit to recipient
    this.io?.to(`user:${recipientId}`).emit('message:received', {
      senderId: userId,
      message,
      bookingId,
      timestamp: new Date(),
    });

    console.log(`[Socket.io] Message from ${userId} to ${recipientId}`);
  }

  /**
   * Handle message read event
   */
  private handleMessageRead(socket: Socket, userId: number, data: any) {
    const { messageId, senderId } = data;

    // Notify sender that message was read
    this.io?.to(`user:${senderId}`).emit('message:read', {
      messageId,
      readBy: userId,
      timestamp: new Date(),
    });

    console.log(`[Socket.io] Message ${messageId} read by ${userId}`);
  }

  /**
   * Handle typing start event
   */
  private handleTypingStart(socket: Socket, userId: number, data: any) {
    const { recipientId, bookingId } = data;

    this.io?.to(`user:${recipientId}`).emit('typing:start', {
      userId,
      bookingId,
    });
  }

  /**
   * Handle typing stop event
   */
  private handleTypingStop(socket: Socket, userId: number, data: any) {
    const { recipientId, bookingId } = data;

    this.io?.to(`user:${recipientId}`).emit('typing:stop', {
      userId,
      bookingId,
    });
  }

  /**
   * Handle notification read event
   */
  private async handleNotificationRead(socket: Socket, userId: number, data: any) {
    const { notificationId } = data;

    try {
      const database = await getDatabase();
      await database
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationId))

      console.log(`[Socket.io] Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('[Socket.io] Error marking notification as read:', error);
    }
  }

  /**
   * Handle user disconnect
   */
  private handleDisconnect(userId: number, socketId: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      const index = userSockets.findIndex((s) => s.socketId === socketId);
      if (index !== -1) {
        userSockets.splice(index, 1);
      }
      if (userSockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }

    console.log(`[Socket.io] User ${userId} disconnected: ${socketId}`);
  }

  /**
   * Get Socket.io instance
   */
  public getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.length > 0;
  }

  /**
   * Get user socket count
   */
  public getUserSocketCount(userId: number): number {
    return this.userSockets.get(userId)?.length || 0;
  }
}

export const socketService = new SocketService();
