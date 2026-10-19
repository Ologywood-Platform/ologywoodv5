import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
const editor = read('client/src/components/EditMusicDescription.tsx');
const manager = read('client/src/pages/ReleaseManager.tsx');

describe('Music release description editor UI contract', () => {
  it('is isolated from the legacy full-release form and is gated by the established actual-owner result', () => {
    expect(manager).toContain('import EditMusicDescription from "@/components/EditMusicDescription";');
    expect(manager).toContain('descriptionEditingEnabled={isCreatorOwner}');
    expect(manager).toContain('shareEnabled={isCreatorOwner}');
    expect(manager).toContain('descriptionEditingEnabled: boolean;');
    expect(manager).toContain('shareEnabled: boolean;');
    expect(manager).toContain('<EditMusicDescription');
    expect(manager).toContain('enabled={descriptionEditingEnabled}');
    expect(manager).toContain('{shareEnabled && <MusicReleaseShareButton release={release} artistName={artistName} />}');
    expect(manager).toContain('teamContextQuery.isSuccess && !teamContext');
    expect(manager).toContain('ownerProfileQuery.data?.userId === user?.id');
    expect(manager).toContain('flex flex-wrap items-center gap-2 flex-shrink-0');
    expect(editor).toContain('if (!enabled) return null;');
    expect(editor).toContain('Edit Description');
  });

  it('uses a dormant owner-only source query and freezes a fresh explicit CAS baseline', () => {
    for (const phrase of [
      'trpc.release.getDescriptionForEdit.useQuery',
      'enabled: false',
      'staleTime: 0',
      'refetchOnMount: "always"',
      'refetchOnWindowFocus: false',
      'const loadSavedDescription = async (replaceDraft: boolean)',
      'if (!dialogOpen || !enabled || disabled || isSaving) return;',
      'expectedDescription: source.description',
      'if (replaceDraft || !editor) setEditor(freezeDescription(result.data));',
      'expectedDescription: editor.expectedDescription',
    ]) expect(editor).toContain(phrase);

    expect(editor).toContain('setEditor(null);');
    expect(editor).toContain('void loadSavedDescription(true);');
    expect(editor).toContain('never adopts a later query-cache update over');
  });

  it('keeps the editor safe and accessible for description-only updates across release statuses', () => {
    expect(editor).toContain('maxLength={2000}');
    expect(editor).toContain('aria-describedby={`${helpId} ${charCountId}`}');
    expect(editor).toContain('role="status" aria-live="polite"');
    expect(editor).toContain('{editor.draft.length} of 2000 characters');
    expect(editor).toContain('A published release remains live; its price, music, and existing purchases are unaffected.');
    expect(editor).toContain('Save Description');
    expect(editor).toContain('disabled={!editor || !hasChanges || isBusy}');
    expect(editor).toContain('description: editor.draft');
    expect(editor).not.toContain('audioFileKey');
    expect(editor).not.toContain('priceInCents');
  });

  it('retains uncertain drafts, confirms destructive reloads, and blocks close/double submits while saving', () => {
    for (const phrase of [
      'safeSaveError(error.data?.code)',
      'Your local draft has not been lost.',
      'Retry save',
      'Reload saved description',
      'window.confirm("Reload the saved description? This discards your unsaved draft.")',
      'submitPendingRef.current = true;',
      'if (!editor || !hasChanges || isBusy || submitPendingRef.current) return;',
      'if (saveMutation.isPending || submitPendingRef.current) return;',
      'showCloseButton={!isSaving}',
      'onEscapeKeyDown={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}',
      'onPointerDownOutside={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}',
      'overlayClassName="z-[70]"',
      'className="z-[71]',
    ]) expect(editor).toContain(phrase);

    expect(editor).toContain('if (code === "CONFLICT")');
    expect(editor).toContain('Never bypass the CAS check');
  });

  it('refreshes management, profile and individual single views after a confirmed save', () => {
    expect(editor).toContain('utils.release.getMyReleases.invalidate()');
    expect(editor).toContain('utils.release.getByArtist.invalidate()');
    expect(editor).toContain('utils.release.getById.invalidate()');
    expect(editor).toContain('utils.release.getPublicSingle.invalidate({ id: releaseId })');
  });
});
