import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { getUserById } from './db';

interface Message {
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface UserSocket {
  userId: number;
  socketId: string;
  role: string;
}

const userSockets: Map<number, UserSocket> = new Map();

export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const userRole = socket.handshake.auth.userRole;

    if (!userId) {
      return next(new Error('Authentication error'));
    }

    socket.data.userId = userId;
    socket.data.userRole = userRole;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const userRole = socket.data.userRole;

    console.log(`[WebSocket] User ${userId} connected with socket ${socket.id}`);

    // Store user socket mapping
    userSockets.set(userId, {
      userId,
      socketId: socket.id,
      role: userRole,
    });

    // Emit online status to all users
    io.emit('user:online', { userId, userRole });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Handle sending messages
    socket.on('message:send', async (data: { conversationId: number; recipientId: number; content: string }) => {
      try {
        const { conversationId, recipientId, content } = data;

        // Create message in database
        const newMessage = {
          conversationId,
          senderId: userId,
          senderName: (await getUserById(userId))?.name || 'Unknown',
          senderRole: userRole,
          content,
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        // Emit message to recipient
        const recipientSocket = userSockets.get(recipientId);
        if (recipientSocket) {
          io.to(`user:${recipientId}`).emit('message:received', {
            ...newMessage,
            id: Math.random(), // In production, use database ID
          });
        }

        // Emit message back to sender
        socket.emit('message:sent', {
          ...newMessage,
          id: Math.random(),
        });

        console.log(`[WebSocket] Message sent from ${userId} to ${recipientId}`);
      } catch (error) {
        console.error('[WebSocket] Error sending message:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { conversationId: number; recipientId: number }) => {
      const recipientSocket = userSockets.get(data.recipientId);
      if (recipientSocket) {
        io.to(`user:${data.recipientId}`).emit('typing:indicator', {
          userId,
          conversationId: data.conversationId,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', (data: { conversationId: number; recipientId: number }) => {
      const recipientSocket = userSockets.get(data.recipientId);
      if (recipientSocket) {
        io.to(`user:${data.recipientId}`).emit('typing:indicator', {
          userId,
          conversationId: data.conversationId,
          isTyping: false,
        });
      }
    });

    // Handle message read receipts
    socket.on('message:read', (data: { messageId: number; conversationId: number }) => {
      socket.broadcast.emit('message:read-receipt', {
        messageId: data.messageId,
        readBy: userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      userSockets.delete(userId);
      io.emit('user:offline', { userId });
      console.log(`[WebSocket] User ${userId} disconnected`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for user ${userId}:`, error);
    });
  });

  return io;
}

export function getConnectedUsers() {
  return Array.from(userSockets.values());
}

export function isUserOnline(userId: number) {
  return userSockets.has(userId);
}
