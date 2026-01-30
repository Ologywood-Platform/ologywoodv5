/**
 * Chat Message Persistence Service
 * Stores and retrieves chat messages from database for conversation history
 */

import { db } from '../db';
import { chatMessages } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface StoredChatMessage {
  id: string;
  userId: number;
  sender: 'user' | 'support';
  message: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export class ChatMessagePersistenceService {
  /**
   * Save a chat message to the database
   */
  static async saveMessage(
    userId: number,
    sender: 'user' | 'support',
    message: string
  ): Promise<StoredChatMessage> {
    const now = new Date();
    
    try {
      const result = await db.insert(chatMessages).values({
        userId,
        sender,
        message,
        timestamp: now,
        status: 'sent',
      });

      return {
        id: result.insertId?.toString() || Date.now().toString(),
        userId,
        sender,
        message,
        timestamp: now,
        status: 'sent',
      };
    } catch (error) {
      console.error('[ChatMessagePersistenceService] Error saving message:', error);
      throw new Error('Failed to save chat message');
    }
  }

  /**
   * Get chat history for a user
   */
  static async getChatHistory(userId: number, limit: number = 50): Promise<StoredChatMessage[]> {
    try {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(desc(chatMessages.timestamp))
        .limit(limit);

      return messages
        .reverse()
        .map(msg => ({
          id: msg.id?.toString() || Date.now().toString(),
          userId: msg.userId,
          sender: msg.sender as 'user' | 'support',
          message: msg.message,
          timestamp: msg.timestamp,
          status: msg.status as 'sending' | 'sent' | 'error',
        }));
    } catch (error) {
      console.error('[ChatMessagePersistenceService] Error retrieving chat history:', error);
      return [];
    }
  }

  /**
   * Delete old chat messages (older than 90 days)
   */
  static async deleteOldMessages(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db
        .delete(chatMessages)
        .where(chatMessages.timestamp < cutoffDate);

      return result.rowsAffected || 0;
    } catch (error) {
      console.error('[ChatMessagePersistenceService] Error deleting old messages:', error);
      return 0;
    }
  }

  /**
   * Clear all chat history for a user
   */
  static async clearUserChatHistory(userId: number): Promise<boolean> {
    try {
      await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
      return true;
    } catch (error) {
      console.error('[ChatMessagePersistenceService] Error clearing chat history:', error);
      return false;
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.userId, userId),
            eq(chatMessages.sender, 'support'),
            eq(chatMessages.status, 'sent')
          )
        );

      return result.length;
    } catch (error) {
      console.error('[ChatMessagePersistenceService] Error getting unread count:', error);
      return 0;
    }
  }
}
