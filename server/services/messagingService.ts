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
  static async createConversation(artistId: number, venueId: number, bookingId?: number): Promise<Conversation> {
    return { id: 1, artistId, venueId, bookingId, lastMessageAt: new Date(), unreadCount: 0, createdAt: new Date(), updatedAt: new Date() };
  }

  static async getOrCreateConversation(artistId: number, venueId: number, bookingId?: number): Promise<Conversation> {
    return await this.createConversation(artistId, venueId, bookingId);
  }

  static async sendMessage(conversationId: number, senderId: number, recipientId: number, content: string, attachmentUrl?: string, attachmentType?: "contract" | "rider" | "document" | "image"): Promise<Message> {
    return { id: 1, conversationId, senderId, recipientId, content, attachmentUrl, attachmentType, isRead: false, createdAt: new Date() };
  }

  static async getConversationMessages(conversationId: number, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return [];
  }

  static async markMessageAsRead(messageId: number): Promise<void> {}

  static async markConversationAsRead(conversationId: number, userId: number): Promise<void> {}

  static async getUserConversations(userId: number): Promise<Conversation[]> {
    return [];
  }

  static async shareFile(conversationId: number, senderId: number, recipientId: number, fileUrl: string, fileType: "contract" | "rider" | "document" | "image", fileName: string): Promise<Message> {
    return await this.sendMessage(conversationId, senderId, recipientId, `Shared: ${fileName}`, fileUrl, fileType);
  }

  static async getUnreadCount(userId: number): Promise<number> {
    return 0;
  }

  static async searchMessages(conversationId: number, query: string): Promise<Message[]> {
    return [];
  }

  static async deleteMessage(messageId: number): Promise<void> {}

  static async getConversationWithLatestMessage(conversationId: number): Promise<(Conversation & { latestMessage?: Message }) | null> {
    return null;
  }
}
