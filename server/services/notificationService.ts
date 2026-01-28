import { Server as SocketIOServer, Socket } from "socket.io";
import { Express } from "express";
import http from "http";

export interface NotificationEvent {
  type: "booking_update" | "contract_signed" | "contract_archived" | "booking_cancelled" | "message_received";
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface UserSocket {
  userId: string;
  socketId: string;
  connectedAt: Date;
}

class NotificationService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, UserSocket[]> = new Map();
  private notificationHistory: Map<string, NotificationEvent[]> = new Map();
  private readonly MAX_HISTORY_PER_USER = 100;

  /**
   * Initialize Socket.io server
   */
  initializeSocket(app: Express, httpServer: http.Server): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupSocketHandlers();
    console.log("[Socket.io] Initialized successfully");
    return this.io;
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      // User joins with their ID
      socket.on("user:join", (userId: string) => {
        this.registerUserSocket(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`[Socket.io] User ${userId} joined (socket: ${socket.id})`);
      });

      // User disconnects
      socket.on("disconnect", () => {
        this.unregisterUserSocket(socket.id);
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });

      // Request notification history
      socket.on("notifications:history", (userId: string, callback) => {
        const history = this.notificationHistory.get(userId) || [];
        callback(history);
      });

      // Mark notification as read
      socket.on("notification:read", (notificationId: string) => {
        console.log(`[Socket.io] Notification marked as read: ${notificationId}`);
      });
    });
  }

  /**
   * Register a user socket connection
   */
  private registerUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId) || [];
    sockets.push({
      userId,
      socketId,
      connectedAt: new Date(),
    });
    this.userSockets.set(userId, sockets);
  }

  /**
   * Unregister a user socket connection
   */
  private unregisterUserSocket(socketId: string): void {
    for (const [userId, sockets] of this.userSockets.entries()) {
      const filtered = sockets.filter((s) => s.socketId !== socketId);
      if (filtered.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, filtered);
      }
    }
  }

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, event: NotificationEvent): void {
    if (!this.io) return;

    // Store in history
    const history = this.notificationHistory.get(userId) || [];
    history.unshift(event);
    if (history.length > this.MAX_HISTORY_PER_USER) {
      history.pop();
    }
    this.notificationHistory.set(userId, history);

    // Send to user's sockets
    this.io.to(`user:${userId}`).emit("notification", event);
    console.log(`[Socket.io] Notification sent to user ${userId}: ${event.type}`);
  }

  /**
   * Send booking update notification
   */
  sendBookingUpdate(userId: string, bookingId: string, status: string, details: Record<string, any>): void {
    this.sendNotification(userId, {
      type: "booking_update",
      userId,
      data: {
        bookingId,
        status,
        ...details,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Send contract signed notification
   */
  sendContractSigned(userId: string, contractId: string, signerName: string): void {
    this.sendNotification(userId, {
      type: "contract_signed",
      userId,
      data: {
        contractId,
        signerName,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Send contract archived notification
   */
  sendContractArchived(userId: string, contractId: string, reason: string): void {
    this.sendNotification(userId, {
      type: "contract_archived",
      userId,
      data: {
        contractId,
        reason,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Send booking cancelled notification
   */
  sendBookingCancelled(userId: string, bookingId: string, reason: string): void {
    this.sendNotification(userId, {
      type: "booking_cancelled",
      userId,
      data: {
        bookingId,
        reason,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Send message received notification
   */
  sendMessageReceived(userId: string, senderId: string, message: string, bookingId: string): void {
    this.sendNotification(userId, {
      type: "message_received",
      userId,
      data: {
        senderId,
        message,
        bookingId,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast notification to multiple users
   */
  broadcastNotification(userIds: string[], event: NotificationEvent): void {
    userIds.forEach((userId) => {
      this.sendNotification(userId, event);
    });
  }

  /**
   * Get active users count
   */
  getActiveUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get user connection status
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const notificationService = new NotificationService();
