import { useEffect, useRef, useCallback, useState } from 'react';

const STORAGE_PREFIX = 'ologywood_rider_draft';
const AUTO_SAVE_DELAY_MS = 2000; // Debounce: save 2 seconds after last change

export interface DraftData {
  formData: Record<string, any>;
  riderName: string;
  templateType: string;
  savedAt: number; // timestamp
}

/**
 * Hook that auto-saves Rider Builder form data to localStorage with debouncing.
 * Provides restore and discard capabilities.
 */
export function useAutoSaveDraft(userId: string | undefined) {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = `${STORAGE_PREFIX}_${userId || 'anonymous'}`;

  // Save draft to localStorage (debounced)
  const saveDraft = useCallback(
    (formData: Record<string, any>, riderName: string, templateType: string) => {
      // Don't save empty drafts
      const hasData = riderName.trim() || Object.keys(formData).some(k => {
        const v = formData[k];
        return v !== undefined && v !== '' && v !== null && v !== false;
      });
      if (!hasData) return;

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Debounce the save
      saveTimerRef.current = setTimeout(() => {
        try {
          const draft: DraftData = {
            formData,
            riderName,
            templateType,
            savedAt: Date.now(),
          };
          localStorage.setItem(storageKey, JSON.stringify(draft));
          setLastSavedAt(draft.savedAt);

          // Show saved indicator briefly
          setShowSavedIndicator(true);
          if (indicatorTimerRef.current) {
            clearTimeout(indicatorTimerRef.current);
          }
          indicatorTimerRef.current = setTimeout(() => {
            setShowSavedIndicator(false);
          }, 3000);
        } catch (e) {
          // localStorage might be full or unavailable — fail silently
          console.warn('[AutoSave] Failed to save draft:', e);
        }
      }, AUTO_SAVE_DELAY_MS);
    },
    [storageKey]
  );

  // Check if a draft exists
  const hasDraft = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;
      const draft: DraftData = JSON.parse(raw);
      // Consider drafts older than 7 days as expired
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - draft.savedAt > SEVEN_DAYS) {
        localStorage.removeItem(storageKey);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Load draft from localStorage
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const draft: DraftData = JSON.parse(raw);
      // Validate structure
      if (!draft.formData || typeof draft.savedAt !== 'number') {
        localStorage.removeItem(storageKey);
        return null;
      }
      // Expire old drafts (7 days)
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - draft.savedAt > SEVEN_DAYS) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Discard the saved draft
  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setLastSavedAt(null);
    } catch {
      // fail silently
    }
  }, [storageKey]);

  // Clear draft (called on successful save)
  const clearDraft = useCallback(() => {
    discardDraft();
    setShowSavedIndicator(false);
  }, [discardDraft]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, []);

  return {
    saveDraft,
    loadDraft,
    hasDraft,
    discardDraft,
    clearDraft,
    lastSavedAt,
    showSavedIndicator,
  };
}
