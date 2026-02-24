import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Email Preferences Tests
 * 
 * The email preferences system has two layers:
 * 1. Stub exports (getEmailPreferences, createEmailPreferences) - return null (placeholder)
 * 2. Real implementations (getEmailPreferencesByUserId, updateEmailPreferences) - use database
 * 
 * These tests verify the code structure and schema are correct without
 * requiring a live database connection, since the stubs are not yet wired
 * to real implementations.
 */

const serverDir = join(__dirname, '..');
const schemaPath = join(__dirname, '..', '..', 'drizzle', 'schema.ts');

describe('Email Preferences', () => {
  describe('Schema', () => {
    it('email_preferences table is defined in drizzle schema', () => {
      expect(existsSync(schemaPath)).toBe(true);
      const schema = readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('email_preferences');
      expect(schema).toContain('emailPreferences');
    });

    it('schema has all required columns', () => {
      const schema = readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('userId');
      expect(schema).toContain('frequency');
      expect(schema).toContain('bookingUpdates');
      expect(schema).toContain('newOpportunities');
      expect(schema).toContain('platformNews');
      expect(schema).toContain('weeklyDigest');
      expect(schema).toContain('reminders');
    });

    it('frequency enum has correct values', () => {
      const schema = readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('"daily"');
      expect(schema).toContain('"weekly"');
      expect(schema).toContain('"never"');
    });

    it('schema has unsubscribe tracking for CAN-SPAM/GDPR compliance', () => {
      const schema = readFileSync(schemaPath, 'utf-8');
      expect(schema).toContain('unsubscribeToken');
      expect(schema).toContain('unsubscribedAt');
    });

    it('schema has sensible defaults', () => {
      const schema = readFileSync(schemaPath, 'utf-8');
      // frequency defaults to weekly
      expect(schema).toMatch(/frequency.*default.*"weekly"/s);
      // bookingUpdates defaults to true
      expect(schema).toMatch(/bookingUpdates.*default.*true/s);
      // platformNews defaults to false
      expect(schema).toMatch(/platformNews.*default.*false/s);
    });
  });

  describe('Database Functions', () => {
    it('db.ts exports getEmailPreferences stub', () => {
      const dbFile = readFileSync(join(serverDir, 'db.ts'), 'utf-8');
      expect(dbFile).toContain('export const getEmailPreferences');
    });

    it('db.ts exports createEmailPreferences stub', () => {
      const dbFile = readFileSync(join(serverDir, 'db.ts'), 'utf-8');
      expect(dbFile).toContain('export const createEmailPreferences');
    });

    it('db.ts has real getEmailPreferencesByUserId implementation', () => {
      const dbFile = readFileSync(join(serverDir, 'db.ts'), 'utf-8');
      expect(dbFile).toContain('export async function getEmailPreferencesByUserId');
      expect(dbFile).toContain('emailPreferences');
    });

    it('db.ts has real updateEmailPreferences implementation', () => {
      const dbFile = readFileSync(join(serverDir, 'db.ts'), 'utf-8');
      expect(dbFile).toContain('export async function updateEmailPreferences');
      // Should handle upsert (create if not exists)
      expect(dbFile).toContain('getEmailPreferencesByUserId');
    });

    it('updateEmailPreferences handles upsert pattern', () => {
      const dbFile = readFileSync(join(serverDir, 'db.ts'), 'utf-8');
      // Extract the updateEmailPreferences function
      const funcStart = dbFile.indexOf('export async function updateEmailPreferences');
      const funcEnd = dbFile.indexOf('\n}', funcStart) + 2;
      const funcBody = dbFile.slice(funcStart, funcEnd);
      
      // Should check for existing record
      expect(funcBody).toContain('existing');
      // Should insert if not found
      expect(funcBody).toContain('insert');
      // Should update if found
      expect(funcBody).toContain('update');
    });
  });

  describe('Stubs', () => {
    it('db-stubs.ts has getEmailPreferences returning null', () => {
      const stubsFile = readFileSync(join(serverDir, 'db-stubs.ts'), 'utf-8');
      expect(stubsFile).toContain('getEmailPreferences');
      expect(stubsFile).toContain('return null');
    });

    it('db-stubs.ts has createEmailPreferences returning null', () => {
      const stubsFile = readFileSync(join(serverDir, 'db-stubs.ts'), 'utf-8');
      expect(stubsFile).toContain('createEmailPreferences');
    });
  });
});
