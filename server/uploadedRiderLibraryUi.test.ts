import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RIDER_PDF_MAX_BYTES, riderPdfDownloadPath } from '../shared/riderDocuments';

const componentSource = readFileSync(resolve(process.cwd(), 'client/src/components/UploadedRiderLibrary.tsx'), 'utf8');
const riderBuilderSource = readFileSync(resolve(process.cwd(), 'client/src/pages/RiderBuilder.tsx'), 'utf8');
const workspaceSource = readFileSync(resolve(process.cwd(), 'client/src/pages/Workspace.tsx'), 'utf8');
const teamManagementSource = readFileSync(resolve(process.cwd(), 'client/src/pages/TeamManagement.tsx'), 'utf8');

describe('UploadedRiderLibrary private PDF safeguards', () => {
  it('permanently preserves client-side PDF, empty-file, and 10 MB validation before upload', () => {
    expect(componentSource).toContain('const hasPdfExtension = /\\.pdf$/i.test(file.name);');
    expect(componentSource).toContain('file.size <= 0');
    expect(componentSource).toContain('file.size > RIDER_PDF_MAX_BYTES');
    expect(componentSource).toContain('PDFs must be ${MAX_UPLOAD_LABEL} or smaller.');
    expect(RIDER_PDF_MAX_BYTES).toBe(10 * 1024 * 1024);
  });

  it('permanently keeps permission/list gates fail-closed while allowing retained PDFs after a plan downgrade', () => {
    expect(componentSource).toContain('if (isFetching || !context) return false;');
    expect(componentSource).toContain('context.ownerUserId !== requestedOwnerUserId');
    expect(componentSource).toContain('return context.canManage;');
    expect(componentSource).toContain('canUpload: usableContext && !!context?.planAllowed');
    expect(componentSource).toContain('disabled={isBusy || !context.planAllowed}');
  });

  it('uses authenticated same-origin rider paths, never storage URLs, for preview and download', () => {
    expect(riderPdfDownloadPath(77)).toBe('/api/rider-documents/77');
    expect(riderPdfDownloadPath(77, undefined, true)).toBe('/api/rider-documents/77?preview=1');
    expect(riderPdfDownloadPath(77, 9, true)).toBe('/api/rider-documents/77?bookingId=9&preview=1');
    expect(componentSource).toContain('riderPdfDownloadPath(document.currentVersionId');
    expect(componentSource).not.toMatch(/https?:\/\/[^\s"']*(s3|storage)/i);
  });

  it('keeps the required destructive/versioning copy and retained retry guards in source', () => {
    expect(componentSource).toContain('Previous booking versions remain unchanged.');
    expect(componentSource).toContain('It does not destroy any booking attachment or its retained version.');
    expect(componentSource).toContain('Your title and PDF are still ready to retry.');
    expect(componentSource).toContain('Your selected PDF is still ready to retry.');
    expect(componentSource).toContain('busyRef.current');
    expect(componentSource).toContain('enabled && contextQuery.isSuccess && canUseUploadedRiderLibrary');
    expect(componentSource).toContain('Reload current version');
    expect(componentSource).toContain('replaceNeedsReload');
    expect(componentSource).toContain('overlayClassName="z-[70]"');
    expect(componentSource).not.toContain('(trpc as any)');
    expect(componentSource).toContain('uploadInputRef.current.value = ""');
    expect(componentSource).toContain('replaceInputRef.current.value = ""');
  });

  it('prevents a collaborator route from fetching legacy templates and requires the explicit persisted permission', () => {
    expect(riderBuilderSource).toContain('enabled: ownLibraryReady');
    expect(riderBuilderSource).toContain('teamContextQuery.data.permissions?.manageRiders === true');
    expect(riderBuilderSource).toContain('enabled={collaboratorLibraryReady}');
  });

  it('only surfaces team rider management from the explicit owner-granted permission', () => {
    expect(workspaceSource).toContain('teamContextQuery.data?.permissions?.manageRiders === true');
    expect(workspaceSource).toContain('/rider-builder?ownerUserId=${teamContextQuery.data.artistUserId}');
    expect(teamManagementSource).toContain('isOwnerView &&');
    expect(teamManagementSource).toContain('member.permissions?.manageRiders === true');
    expect(teamManagementSource).toContain('setRiderPermission');
  });
});
