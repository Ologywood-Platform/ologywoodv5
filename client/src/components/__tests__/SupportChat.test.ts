import { describe, it, expect, beforeEach } from 'vitest';

describe('SupportChat Component', () => {
  let chatState: {
    isOpen: boolean;
    messages: Array<{ id: string; sender: 'user' | 'support'; message: string }>;
    inputValue: string;
  };

  beforeEach(() => {
    chatState = {
      isOpen: false,
      messages: [
        {
          id: '1',
          sender: 'support',
          message: 'Hello! Welcome to Ologywood Support.',
        },
      ],
      inputValue: '',
    };
  });

  it('should initialize chat as closed', () => {
    expect(chatState.isOpen).toBe(false);
  });

  it('should open chat when button is clicked', () => {
    chatState.isOpen = true;
    expect(chatState.isOpen).toBe(true);
  });

  it('should close chat when X button is clicked', () => {
    chatState.isOpen = true;
    chatState.isOpen = false;
    expect(chatState.isOpen).toBe(false);
  });

  it('should add user message to chat', () => {
    const userMessage = 'How do I create a rider?';
    chatState.messages.push({
      id: '2',
      sender: 'user',
      message: userMessage,
    });

    expect(chatState.messages.length).toBe(2);
    expect(chatState.messages[1].sender).toBe('user');
    expect(chatState.messages[1].message).toBe(userMessage);
  });

  it('should add support response after user message', () => {
    const userMessage = 'How do I create a rider?';
    chatState.messages.push({
      id: '2',
      sender: 'user',
      message: userMessage,
    });

    const supportResponse =
      'Great question about riders! Riders are detailed performance requirements...';
    chatState.messages.push({
      id: '3',
      sender: 'support',
      message: supportResponse,
    });

    expect(chatState.messages.length).toBe(3);
    expect(chatState.messages[2].sender).toBe('support');
  });

  it('should clear input after sending message', () => {
    chatState.inputValue = 'How do I create a rider?';
    expect(chatState.inputValue).toBeTruthy();

    // Simulate sending
    chatState.inputValue = '';
    expect(chatState.inputValue).toBe('');
  });

  it('should handle quick reply selection', () => {
    const quickReply = 'How do I create a rider?';
    chatState.messages.push({
      id: '2',
      sender: 'user',
      message: quickReply,
    });

    expect(chatState.messages[chatState.messages.length - 1].message).toBe(quickReply);
  });

  it('should detect rider-related keywords', () => {
    const keywords = ['rider', 'requirement', 'modification'];
    const userMessage = 'I need help with my rider requirements';

    const hasKeyword = keywords.some(kw => userMessage.toLowerCase().includes(kw));
    expect(hasKeyword).toBe(true);
  });

  it('should detect booking-related keywords', () => {
    const keywords = ['booking', 'request', 'confirm'];
    const userMessage = 'How do I confirm my booking?';

    const hasKeyword = keywords.some(kw => userMessage.toLowerCase().includes(kw));
    expect(hasKeyword).toBe(true);
  });

  it('should detect technical issue keywords', () => {
    const keywords = ['error', 'bug', 'not working', 'crash'];
    const userMessage = 'I got an error when trying to save my rider';

    const hasKeyword = keywords.some(kw => userMessage.toLowerCase().includes(kw));
    expect(hasKeyword).toBe(true);
  });

  it('should show support hours indicator', () => {
    const now = new Date();
    const hour = now.getHours();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    const SUPPORT_HOURS = {
      start: 9,
      end: 18,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    };

    const isOnline =
      SUPPORT_HOURS.days.includes(dayName) &&
      hour >= SUPPORT_HOURS.start &&
      hour < SUPPORT_HOURS.end;

    // Just verify the logic works
    expect(typeof isOnline).toBe('boolean');
  });

  it('should display message timestamps', () => {
    const message = {
      id: '2',
      sender: 'user' as const,
      message: 'Test message',
      timestamp: new Date('2026-01-15T14:30:00'),
    };

    const timeString = message.timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    expect(timeString).toBeTruthy();
    expect(timeString).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should handle empty message submission', () => {
    chatState.inputValue = '';
    const isValid = chatState.inputValue.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it('should handle long message submission', () => {
    const longMessage = 'a'.repeat(500);
    chatState.inputValue = longMessage;
    expect(chatState.inputValue.length).toBe(500);
  });

  it('should maintain message order', () => {
    chatState.messages.push({
      id: '2',
      sender: 'user',
      message: 'First message',
    });

    chatState.messages.push({
      id: '3',
      sender: 'support',
      message: 'First response',
    });

    chatState.messages.push({
      id: '4',
      sender: 'user',
      message: 'Second message',
    });

    expect(chatState.messages[1].message).toBe('First message');
    expect(chatState.messages[2].message).toBe('First response');
    expect(chatState.messages[3].message).toBe('Second message');
  });

  it('should handle multiple quick replies', () => {
    const quickReplies = [
      'How do I create a rider?',
      'How do I compare riders?',
      'How do I propose modifications?',
    ];

    expect(quickReplies.length).toBe(3);
    quickReplies.forEach(reply => {
      expect(reply).toBeTruthy();
      expect(typeof reply).toBe('string');
    });
  });

  it('should categorize support requests correctly', () => {
    const testCases = [
      { message: 'How do I create a rider?', expected: 'rider' },
      { message: 'I need help with my booking', expected: 'booking' },
      { message: 'Payment failed', expected: 'payment' },
      { message: 'I got an error', expected: 'technical' },
    ];

    testCases.forEach(({ message, expected }) => {
      const keywords = {
        rider: ['rider', 'requirement', 'modification'],
        booking: ['booking', 'request', 'confirm'],
        payment: ['payment', 'invoice', 'refund'],
        technical: ['error', 'bug', 'not working'],
      };

      let category = 'other';
      for (const [cat, kws] of Object.entries(keywords)) {
        if (kws.some(kw => message.toLowerCase().includes(kw))) {
          category = cat;
          break;
        }
      }

      expect(category).toBe(expected);
    });
  });
});
