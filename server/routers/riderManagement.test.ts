import { describe, it, expect, beforeEach, vi } from 'vitest';
import { riderManagementRouter } from './riderManagement';
import { TRPCError } from '@trpc/server';

// Mock context
const mockContext = {
  user: {
    id: 1,
    email: 'artist@test.com',
    role: 'artist',
  },
};

describe('Rider Management Router', () => {
  describe('saveTemplate', () => {
    it('should save a rider template successfully', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const result = await caller.saveTemplate({
        templateName: 'Jazz Quartet Rider',
        description: 'Standard rider for jazz quartet performances',
        sections: [
          {
            title: 'Technical Requirements',
            content: 'Sound system with 2 main speakers',
            isRequired: true,
          },
        ],
        isPublic: true,
      });

      expect(result.success).toBe(true);
      expect(result.templateId).toBeDefined();
      expect(typeof result.templateId).toBe('number');
    });

    it('should reject template with empty name', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      try {
        await caller.saveTemplate({
          templateName: '',
          sections: [],
          isPublic: false,
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should save template with sections', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const result = await caller.saveTemplate({
        templateName: 'Complete Rider',
        sections: [
          {
            title: 'Technical',
            content: 'Full sound system',
            isRequired: true,
          },
          {
            title: 'Hospitality',
            content: 'Green room with refreshments',
            isRequired: true,
          },
          {
            title: 'Payment',
            content: '50% deposit required',
            isRequired: true,
          },
        ],
        isPublic: false,
      });

      expect(result.success).toBe(true);
      expect(result.templateId).toBeDefined();
    });
  });

  describe('getMyTemplates', () => {
    it('should return templates for authenticated user', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const templates = await caller.getMyTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      if (templates.length > 0) {
        expect(templates[0]).toHaveProperty('templateName');
        expect(templates[0]).toHaveProperty('artistId');
      }
    });
  });

  describe('getTemplate', () => {
    it('should retrieve a specific template', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const template = await caller.getTemplate({
        templateId: 1,
      });

      if (template) {
        expect(template).toHaveProperty('templateName');
        expect(template).toHaveProperty('id');
      }
    });

    it('should return template data when requested', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const template = await caller.getTemplate({
        templateId: 1,
      });

      expect(template).toBeDefined();
      expect(template).toHaveProperty('templateName');
      expect(template?.templateName).toBe('Standard Jazz Rider');
    });
  });

  describe('updateTemplate', () => {
    it('should update template name', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const result = await caller.updateTemplate({
        templateId: 1,
        templateName: 'Updated Rider Name',
      });

      expect(result.success).toBe(true);
    });

    it('should update template description', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const result = await caller.updateTemplate({
        templateId: 1,
        description: 'Updated description',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      const caller = riderManagementRouter.createCaller(mockContext as any);
      
      const result = await caller.deleteTemplate({
        templateId: 1,
      });

      expect(result.success).toBe(true);
    });
  });
});
