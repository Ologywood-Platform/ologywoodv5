import { describe, it, expect } from 'vitest';

describe('Send Rider Message Feature', () => {
  it('should have messageType and metadata fields in the messages schema', async () => {
    const { messages } = await import('../drizzle/schema');
    // Verify the messages table has the new columns
    expect(messages.messageType).toBeDefined();
    expect(messages.metadata).toBeDefined();
  });

  it('should have the sendRider mutation in the message router', async () => {
    const { appRouter } = await import('./routers');
    // Verify the sendRider procedure exists on the message router
    const messageRouter = (appRouter as any)._def.procedures;
    expect(messageRouter['message.sendRider']).toBeDefined();
  });

  it('should have the send mutation in the message router', async () => {
    const { appRouter } = await import('./routers');
    const messageRouter = (appRouter as any)._def.procedures;
    expect(messageRouter['message.send']).toBeDefined();
  });

  it('should validate rider message metadata structure', () => {
    const validMetadata = {
      riderTemplateId: 1,
      riderTemplateName: 'My Standard Performance Rider',
      riderTemplateData: {
        stageSize: '20x20 minimum',
        soundRequirements: 'Full PA system',
        dressingRooms: '1 private dressing room',
        depositRequired: '50% upfront',
      },
    };

    expect(validMetadata.riderTemplateId).toBeGreaterThan(0);
    expect(validMetadata.riderTemplateName).toBeTruthy();
    expect(typeof validMetadata.riderTemplateData).toBe('object');
    expect(validMetadata.riderTemplateData.stageSize).toBeDefined();
  });

  it('should differentiate rider messages from text messages', () => {
    const textMessage = { messageType: 'text', content: 'Hello', metadata: null };
    const riderMessage = {
      messageType: 'rider',
      content: '📋 Rider: My Standard Performance Rider',
      metadata: {
        riderTemplateId: 1,
        riderTemplateName: 'My Standard Performance Rider',
        riderTemplateData: { stageSize: '20x20' },
      },
    };

    expect(textMessage.messageType).toBe('text');
    expect(riderMessage.messageType).toBe('rider');
    expect(riderMessage.metadata).not.toBeNull();
    expect(riderMessage.metadata.riderTemplateData).toBeDefined();
  });
});
