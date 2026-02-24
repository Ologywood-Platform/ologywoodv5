import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Email Preferences Tests
 * 
 * Tests verify:
 * 1. Schema correctness (columns, types, defaults)
 * 2. Real DB function implementations exist and have correct signatures
 * 3. Router endpoints are properly wired
 * 4. Frontend components use the correct API calls
 */

const serverDir = join(__dirname, '..');
const schemaPath = join(__dirname, '..', '..', 'drizzle', 'schema.ts');
const clientDir = join(__dirname, '..', '..', 'client', 'src');

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

    it('frequency enum has correct values (daily, weekly, never)', () => {
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
      expect(schema).toMatch(/frequency.*default.*"weekly"/s);
      expect(schema).toMatch(/bookingUpdates.*default.*true/s);
      expect(schema).toMatch(/platformNews.*default.*false/s);
    });
  });

  describe('Real Database Functions', () => {
    const dbFile = readFileSync(join(serverDir, 'db.ts'), 'utf-8');

    it('exports getEmailPreferences as a real async function', () => {
      expect(dbFile).toContain('export async function getEmailPreferences(userId: number)');
      // Should return null instead of undefined for React Query compatibility
      expect(dbFile).toContain('?? null');
    });

    it('exports createEmailPreferences as a real async function', () => {
      expect(dbFile).toContain('export async function createEmailPreferences(userId: number)');
      // Should check for existing before creating
      expect(dbFile).toContain('Check if preferences already exist');
    });

    it('exports updateEmailPreferences with upsert pattern', () => {
      expect(dbFile).toContain('export async function updateEmailPreferences(userId: number');
      // Should handle both update and insert
      const funcStart = dbFile.indexOf('export async function updateEmailPreferences');
      const funcEnd = dbFile.indexOf('\n}', funcStart) + 2;
      const funcBody = dbFile.slice(funcStart, funcEnd);
      expect(funcBody).toContain('existing');
      expect(funcBody).toContain('insert');
      expect(funcBody).toContain('update');
    });

    it('exports deleteEmailPreferences as a real async function', () => {
      expect(dbFile).toContain('export async function deleteEmailPreferences(userId: number)');
      expect(dbFile).toContain('delete(emailPreferences)');
    });

    it('updateEmailPreferences returns the updated preferences', () => {
      const funcStart = dbFile.indexOf('export async function updateEmailPreferences');
      const funcEnd = dbFile.indexOf('\n}', funcStart) + 2;
      const funcBody = dbFile.slice(funcStart, funcEnd);
      // Should return the result after update
      expect(funcBody).toContain('return await getEmailPreferences');
    });

    it('createEmailPreferences sets correct defaults', () => {
      const funcStart = dbFile.indexOf('export async function createEmailPreferences');
      const funcEnd = dbFile.indexOf('\n}', funcStart) + 2;
      const funcBody = dbFile.slice(funcStart, funcEnd);
      expect(funcBody).toContain("frequency: 'weekly'");
      expect(funcBody).toContain('bookingUpdates: true');
      expect(funcBody).toContain('newOpportunities: true');
      expect(funcBody).toContain('platformNews: false');
      expect(funcBody).toContain('weeklyDigest: true');
      expect(funcBody).toContain('reminders: true');
    });

    it('no longer uses stubs for email preferences', () => {
      // The stub exports should be removed
      expect(dbFile).not.toContain('export const getEmailPreferences = stubs.getEmailPreferences');
      expect(dbFile).not.toContain('export const createEmailPreferences = stubs.createEmailPreferences');
    });

    it('provides getEmailPreferencesByUserId alias for backward compatibility', () => {
      expect(dbFile).toContain('export const getEmailPreferencesByUserId = getEmailPreferences');
    });
  });

  describe('Router Endpoints', () => {
    const routerFile = readFileSync(join(serverDir, 'routers', 'emailPreferences.ts'), 'utf-8');

    it('has getPreferences endpoint', () => {
      expect(routerFile).toContain('getPreferences:');
      expect(routerFile).toContain('db.getEmailPreferences');
    });

    it('has updatePreferences endpoint with proper input validation', () => {
      expect(routerFile).toContain('updatePreferences:');
      expect(routerFile).toContain('z.enum(["daily", "weekly", "never"])');
      expect(routerFile).toContain('z.boolean()');
    });

    it('has unsubscribeAll endpoint that sets frequency to never', () => {
      expect(routerFile).toContain('unsubscribeAll:');
      expect(routerFile).toContain('frequency: "never"');
      expect(routerFile).toContain('bookingUpdates: false');
    });

    it('has resubscribe endpoint that restores defaults', () => {
      expect(routerFile).toContain('resubscribe:');
      expect(routerFile).toContain('frequency: "weekly"');
      expect(routerFile).toContain('bookingUpdates: true');
    });

    it('has deletePreferences endpoint', () => {
      expect(routerFile).toContain('deletePreferences:');
      expect(routerFile).toContain('db.deleteEmailPreferences');
    });

    it('getPreferences auto-creates defaults if none exist', () => {
      expect(routerFile).toContain('db.createEmailPreferences');
    });
  });

  describe('Frontend Integration', () => {
    it('EmailPreferencesCenter uses real tRPC calls', () => {
      const filePath = join(clientDir, 'components', 'EmailPreferencesCenter.tsx');
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('trpc.emailPreferences.getPreferences.useQuery');
      expect(content).toContain('trpc.emailPreferences.updatePreferences.useMutation');
      expect(content).toContain('trpc.emailPreferences.unsubscribeAll.useMutation');
      expect(content).toContain('trpc.emailPreferences.resubscribe.useMutation');
    });

    it('EmailPreferencesCenter correctly handles frequency changes', () => {
      const filePath = join(clientDir, 'components', 'EmailPreferencesCenter.tsx');
      const content = readFileSync(filePath, 'utf-8');
      // Should not hardcode frequency to 'weekly'
      expect(content).not.toContain("handleFrequencyChange('weekly')");
      // Should use the actual frequency value
      expect(content).toContain("freq as 'daily' | 'weekly' | 'never'");
    });

    it('EmailPreferencesCenter correctly detects unsubscribed state', () => {
      const filePath = join(clientDir, 'components', 'EmailPreferencesCenter.tsx');
      const content = readFileSync(filePath, 'utf-8');
      // Should check for 'never', not 'weekly'
      expect(content).toContain("frequency === 'never'");
    });

    it('Unsubscribe page uses real API call instead of setTimeout', () => {
      const filePath = join(clientDir, 'pages', 'Unsubscribe.tsx');
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('trpc.emailPreferences.unsubscribeAll.useMutation');
      // Should NOT use setTimeout simulation
      expect(content).not.toContain('setTimeout');
    });

    it('Unsubscribe page handles authenticated and unauthenticated users', () => {
      const filePath = join(clientDir, 'pages', 'Unsubscribe.tsx');
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('useAuth');
      expect(content).toContain('isAuthenticated');
    });
  });
});
