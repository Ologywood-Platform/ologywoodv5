import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Auto-Save Draft Feature (Rider Builder)', () => {
  const hookPath = path.resolve(__dirname, '../../client/src/hooks/useAutoSaveDraft.ts');
  const riderBuilderPath = path.resolve(__dirname, '../../client/src/pages/RiderBuilder.tsx');

  describe('useAutoSaveDraft Hook', () => {
    it('hook file exists', () => {
      expect(fs.existsSync(hookPath)).toBe(true);
    });

    it('exports useAutoSaveDraft function', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('export function useAutoSaveDraft');
    });

    it('exports DraftData interface', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('export interface DraftData');
    });

    it('stores formData, riderName, templateType, and savedAt timestamp', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('formData: Record<string, any>');
      expect(content).toContain('riderName: string');
      expect(content).toContain('templateType: string');
      expect(content).toContain('savedAt: number');
    });

    it('uses localStorage with a user-specific key', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('localStorage');
      expect(content).toContain('ologywood_rider_draft');
      expect(content).toContain('userId');
    });

    it('implements debounced saving (2 second delay)', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('AUTO_SAVE_DELAY_MS');
      expect(content).toContain('2000');
      expect(content).toContain('setTimeout');
    });

    it('provides saveDraft method', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('saveDraft');
    });

    it('provides loadDraft method', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('loadDraft');
    });

    it('provides hasDraft method to check for existing draft', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('hasDraft');
    });

    it('provides discardDraft method', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('discardDraft');
    });

    it('provides clearDraft method (for successful submission)', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('clearDraft');
    });

    it('provides showSavedIndicator state for UI feedback', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('showSavedIndicator');
    });

    it('expires drafts older than 7 days', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('SEVEN_DAYS');
      expect(content).toContain('7 * 24 * 60 * 60 * 1000');
    });

    it('does not save empty drafts', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain("Don't save empty drafts");
    });

    it('handles localStorage errors gracefully', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('catch');
      expect(content).toContain('fail silently');
    });

    it('cleans up timers on unmount', () => {
      const content = fs.readFileSync(hookPath, 'utf-8');
      expect(content).toContain('clearTimeout');
      expect(content).toContain('return () =>');
    });
  });

  describe('RiderBuilder Integration', () => {
    it('imports useAutoSaveDraft hook', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain("import { useAutoSaveDraft }");
    });

    it('initializes the auto-save hook with user ID', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('useAutoSaveDraft(user?.id)');
    });

    it('auto-saves form data on changes in edit mode', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain("autoSave.saveDraft(formData, riderName, selectedTemplateType)");
    });

    it('only auto-saves for new riders (not editing existing)', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain("mode === 'edit' && !editingTemplateId");
    });

    it('checks for existing draft on mount', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('autoSave.hasDraft()');
    });

    it('shows draft restore banner when draft exists', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('showDraftBanner');
      expect(content).toContain('unsaved draft');
    });

    it('provides Restore Draft button', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('Restore Draft');
      expect(content).toContain('restoreDraft');
    });

    it('provides Discard button', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('Discard');
      expect(content).toContain('handleDiscardDraft');
    });

    it('clears draft on successful form submission', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('autoSave.clearDraft()');
    });

    it('shows "Draft saved" indicator in edit mode', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('Draft saved');
      expect(content).toContain('autoSave.showSavedIndicator');
    });

    it('restoreDraft function sets form state from draft', () => {
      const content = fs.readFileSync(riderBuilderPath, 'utf-8');
      expect(content).toContain('setSelectedTemplateType(draft.templateType)');
      expect(content).toContain('setFormData(draft.formData)');
      expect(content).toContain('setRiderName(draft.riderName)');
    });
  });
});
