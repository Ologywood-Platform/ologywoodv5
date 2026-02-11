import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../db';

describe('Email Preferences', () => {
  // Use timestamp to ensure unique user IDs across test runs
  const baseUserId = 9000 + Math.floor(Date.now() % 1000);

  beforeAll(async () => {
    // Clean up any existing test data
    for (let i = 0; i < 10; i++) {
      try {
        await db.deleteEmailPreferences(baseUserId + i);
      } catch (error) {
        // Ignore if doesn't exist
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (let i = 0; i < 10; i++) {
      try {
        await db.deleteEmailPreferences(baseUserId + i);
      } catch (error) {
        // Ignore if doesn't exist
      }
    }
  });

  it('should create default email preferences for a new user', async () => {
    const userId = baseUserId + 0;
    const prefs = await db.createEmailPreferences(userId);
    
    expect(prefs).toBeDefined();
    expect(prefs.userId).toBe(userId);
    expect(prefs.frequency).toBe('weekly');
    expect(prefs.bookingUpdates).toBe(true);
    expect(prefs.newOpportunities).toBe(true);
    expect(prefs.platformNews).toBe(false);
    expect(prefs.weeklyDigest).toBe(true);
    expect(prefs.reminders).toBe(true);
  });

  it('should retrieve existing email preferences', async () => {
    const userId = baseUserId + 1;
    // First create preferences
    await db.createEmailPreferences(userId);
    
    // Then retrieve them
    const prefs = await db.getEmailPreferences(userId);
    
    expect(prefs).toBeDefined();
    expect(prefs?.userId).toBe(userId);
    expect(prefs?.frequency).toBe('weekly');
  });

  it('should update email preferences', async () => {
    const userId = baseUserId + 2;
    // Create initial preferences
    await db.createEmailPreferences(userId);
    
    // Update them
    const updated = await db.updateEmailPreferences(userId, {
      frequency: 'daily',
      platformNews: true,
      bookingUpdates: false,
    });
    
    expect(updated).toBeDefined();
    expect(updated?.frequency).toBe('daily');
    expect(updated?.platformNews).toBe(true);
    expect(updated?.bookingUpdates).toBe(false);
    // Verify other fields remain unchanged
    expect(updated?.reminders).toBe(true);
  });

  it('should create preferences if they do not exist during update', async () => {
    const userId = baseUserId + 3;
    // Delete preferences first
    await db.deleteEmailPreferences(userId);
    
    // Update should create them
    const updated = await db.updateEmailPreferences(userId, {
      frequency: 'weekly',
    });
    
    expect(updated).toBeDefined();
    expect(updated?.userId).toBe(userId);
  });

  it('should handle unsubscribe (set frequency to never)', async () => {
    const userId = baseUserId + 4;
    // Create initial preferences
    await db.createEmailPreferences(userId);
    
    // Unsubscribe
    const updated = await db.updateEmailPreferences(userId, {
      frequency: 'never',
      bookingUpdates: false,
      newOpportunities: false,
      platformNews: false,
      weeklyDigest: false,
      reminders: false,
    });
    
    expect(updated?.frequency).toBe('never');
    expect(updated?.bookingUpdates).toBe(false);
    expect(updated?.newOpportunities).toBe(false);
    expect(updated?.platformNews).toBe(false);
    expect(updated?.weeklyDigest).toBe(false);
    expect(updated?.reminders).toBe(false);
  });

  it('should delete email preferences', async () => {
    const userId = baseUserId + 5;
    // Create preferences
    await db.createEmailPreferences(userId);
    
    // Verify they exist
    let prefs = await db.getEmailPreferences(userId);
    expect(prefs).toBeDefined();
    
    // Delete them
    await db.deleteEmailPreferences(userId);
    
    // Verify they are deleted
    prefs = await db.getEmailPreferences(userId);
    expect(prefs).toBeNull();
  });

  it('should return null when getting non-existent preferences', async () => {
    const userId = baseUserId + 6;
    // Make sure they don't exist
    await db.deleteEmailPreferences(userId);
    
    // Try to get them
    const prefs = await db.getEmailPreferences(userId);
    expect(prefs).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    const userId = baseUserId + 7;
    // Create initial preferences
    await db.createEmailPreferences(userId);
    
    // Update only specific fields
    const updated = await db.updateEmailPreferences(userId, {
      frequency: 'daily',
    });
    
    // Verify only frequency changed
    expect(updated?.frequency).toBe('daily');
    // Other fields should remain at default
    expect(updated?.bookingUpdates).toBe(true);
    expect(updated?.reminders).toBe(true);
  });
});
