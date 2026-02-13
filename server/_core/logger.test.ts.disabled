import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  let consoleSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info message with timestamp', () => {
      logger.info('Test message');
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('[INFO]');
      expect(logCall).toContain('Test message');
    });

    it('should include context in log', () => {
      logger.info('Test message', { userId: 123, endpoint: 'test.endpoint' });
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('userId');
      expect(logCall).toContain('123');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0][0];
      expect(logCall).toContain('[WARN]');
      expect(logCall).toContain('Warning message');
    });
  });

  describe('error', () => {
    it('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('[ERROR]');
      expect(logCall).toContain('Error occurred');
    });

    it('should log error with string message', () => {
      logger.error('Error occurred', 'String error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('[ERROR]');
    });
  });

  describe('trpcCall', () => {
    it('should log TRPC call with endpoint and user', () => {
      logger.trpcCall('artist.getProfile', 1, 45);
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('TRPC Call');
      expect(logCall).toContain('artist.getProfile');
      expect(logCall).toContain('userId');
      expect(logCall).toContain('45ms');
    });
  });

  describe('trpcError', () => {
    it('should log TRPC error with endpoint', () => {
      const error = new Error('Query failed');
      logger.trpcError('artist.getProfile', error, 1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('TRPC Error');
      expect(logCall).toContain('artist.getProfile');
    });
  });

  describe('apiResponse', () => {
    it('should log API response with status code and duration', () => {
      logger.apiResponse('/api/artist/1', 200, 150, 1);
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('API Response');
      expect(logCall).toContain('200');
      expect(logCall).toContain('150ms');
    });
  });
});
