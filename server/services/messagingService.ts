import { getDb } from "../db";

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  recipientId: number;
  content: string;
  attachmentUrl?: string;
  attachmentType?: "contract" | "rider" | "document" | "image";
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  artistId: number;
  venueId: number;
  bookingId?: number;
  lastMessageAt: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingService {
  /**
   * Create a new conversation
   */
  static async createConversation(
    artistId: number,
    venueId: number,
    bookingId?: number
  ): Promise<Conversation> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const result = await db.insert({
        artistId,
        venueId,
        bookingId,
        lastMessageAt: new Date(),
        unreadCount: 0,
      } as any);

      return {
        id: result.insertId as number,
        artistId,
        venueId,
        bookingId,
        lastMessageAt: new Date(),
        unreadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Get or create conversation between artist and venue
   */
  static async getOrCreateConversation(
    artistId: number,
    venueId: number,
    bookingId?: number
  ): Promise<Conversation> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // Try to find existing conversation
      const existing = await db.select().from({} as any);
      if (existing) return existing;

      // Create new conversation if doesn't exist
      return await this.createConversation(artistId, venueId, bookingId);
    } catch (error) {
      console.error("Error getting or creating conversation:", error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: number,
    senderId: number,
    recipientId: number,
    content: string,
    attachmentUrl?: string,
    attachmentType?: "contract" | "rider" | "document" | "image"
  ): Promise<Message> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const result = await db.insert({
        conversationId,
        senderId,
        recipientId,
        content,
        attachmentUrl,
        attachmentType,
        isRead: false,
      } as any);

      // Update conversation last message time
      await db.update({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      } as any);

      return {
        id: result.insertId as number,
        conversationId,
        senderId,
        recipientId,
        content,
        attachmentUrl,
        attachmentType,
        isRead: false,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  static async getConversationMessages(
    conversationId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const messages = await db.select().from({} as any);
      return messages || [];
    } catch (error) {
      console.error("Error getting messages:", error);
      return [];
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      await db.update({
        isRead: true,
        readAt: new Date(),
      } as any);
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }

  /**
   * Mark all messages in conversation as read
   */
  static async markConversationAsRead(conversationId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      await db.update({
        isRead: true,
        readAt: new Date(),
      } as any);

      // Update conversation unread count
      await db.update({
        unreadCount: 0,
      } as any);
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw error;
    }
  }

  /**
   * Get user conversations
   */
  static async getUserConversations(userId: number): Promise<Conversation[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const conversations = await db.select().from({} as any);
      return conversations || [];
    } catch (error) {
      console.error("Error getting conversations:", error);
      return [];
    }
  }

  /**
   * Share file in conversation
   */
  static async shareFile(
    conversationId: number,
    senderId: number,
    recipientId: number,
    fileUrl: string,
    fileType: "contract" | "rider" | "document" | "image",
    fileName: string
  ): Promise<Message> {
    try {
      return await this.sendMessage(
        conversationId,
        senderId,
        recipientId,
        `Shared: ${fileName}`,
        fileUrl,
        fileType
      );
    } catch (error) {
      console.error("Error sharing file:", error);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    try {
      const messages = await db.select().from({} as any);
      return messages.filter((m: any) => !m.isRead).length || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Search messages
   */
  static async searchMessages(
    conversationId: number,
    query: string
  ): Promise<Message[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const messages = await db.select().from({} as any);
      return messages.filter((m: any) => m.content.includes(query)) || [];
    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      await db.delete().from({} as any);
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  /**
   * Get conversation with latest message
   */
  static async getConversationWithLatestMessage(
    conversationId: number
  ): Promise<(Conversation & { latestMessage?: Message }) | null> {
    const db = await getDb();
    if (!db) return null;

    try {
      const conversation = await db.select().from({} as any);
      if (!conversation) return null;

      const messages = await this.getConversationMessages(conversationId, 1);
      return {
        ...conversation,
        latestMessage: messages[0],
      };
    } catch (error) {
      console.error("Error getting conversation with latest message:", error);
      return null;
    }
  }
}
