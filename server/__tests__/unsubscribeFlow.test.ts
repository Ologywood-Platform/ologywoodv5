import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Unsubscribe Page - Confirmation Flow', () => {
  const unsubscribePage = readFileSync(
    resolve(__dirname, '../../client/src/pages/Unsubscribe.tsx'),
    'utf-8'
  );

  it('should show confirmation step before unsubscribing (never auto-unsubscribe)', () => {
    // The default state should be 'confirm', not auto-unsubscribe
    expect(unsubscribePage).toContain("'confirm'");
    expect(unsubscribePage).toContain('Are you sure you want to unsubscribe?');
    expect(unsubscribePage).toContain('Before You Go');
  });

  it('should NOT auto-unsubscribe authenticated users', () => {
    // Should not call handleUnsubscribe in useEffect
    expect(unsubscribePage).not.toMatch(/useEffect[\s\S]*handleUnsubscribe\(\)/);
  });

  it('should warn users what they will miss', () => {
    expect(unsubscribePage).toContain("You'll stop receiving");
    expect(unsubscribePage).toContain('Booking requests and confirmations');
    expect(unsubscribePage).toContain('New opportunity alerts');
    expect(unsubscribePage).toContain('Event reminders');
  });

  it('should offer "reduce frequency" alternative before full unsubscribe', () => {
    expect(unsubscribePage).toContain('Prefer fewer emails instead?');
    expect(unsubscribePage).toContain('Just Reduce My Emails');
    expect(unsubscribePage).toContain('handleReduceFrequency');
  });

  it('should link to settings for granular control', () => {
    expect(unsubscribePage).toContain('/settings');
    expect(unsubscribePage).toContain('Choose Exactly What to Receive');
  });

  it('should make unsubscribe button less prominent than alternatives', () => {
    // Unsubscribe button uses outline/border style, not filled
    expect(unsubscribePage).toContain('border-red-300');
    expect(unsubscribePage).toContain('text-red-600');
    expect(unsubscribePage).toContain('Yes, Unsubscribe from All Emails');
  });

  it('should provide cancel/go-back option', () => {
    expect(unsubscribePage).toContain('Never mind, take me back');
  });

  it('should show resubscribe option after unsubscribing', () => {
    expect(unsubscribePage).toContain("Changed your mind?");
    expect(unsubscribePage).toContain('Resubscribe');
    expect(unsubscribePage).toContain('handleResubscribe');
  });

  it('should have a resubscribed success state', () => {
    expect(unsubscribePage).toContain('Welcome Back!');
    expect(unsubscribePage).toContain("You're subscribed to emails again");
  });

  it('should handle login-required state for unauthenticated users', () => {
    expect(unsubscribePage).toContain('Sign In Required');
    expect(unsubscribePage).toContain('Sign In to Manage Preferences');
  });

  it('should have error state with retry option', () => {
    expect(unsubscribePage).toContain('Something Went Wrong');
    expect(unsubscribePage).toContain('Try Again');
  });

  it('should mention transactional emails will still be sent', () => {
    expect(unsubscribePage).toContain('transactional emails');
  });
});
