import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Download,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Star,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RIDER_PDF_MAX_BYTES,
  riderPdfDownloadPath,
  type RiderDocumentContext,
  type RiderDocumentSummary,
} from "@shared/riderDocuments";

export type UploadedRiderLibraryCapability = {
  ready: boolean;
  canUpload: boolean;
};

export type UploadedRiderLibraryProps = {
  /** The artist account whose private rider library is being managed. Omit for the signed-in owner. */
  ownerUserId?: number;
  /** Do not start document requests until the caller has resolved the authenticated team context. */
  enabled: boolean;
  /** Lets the My Riders header place Upload PDF alongside New Rider without duplicating document state. */
  uploadRequestToken?: number;
  onCapabilityChange?: (capability: UploadedRiderLibraryCapability) => void;
};

const MAX_UPLOAD_LABEL = "10 MB";

function ownerInput(ownerUserId?: number): { ownerUserId: number } | undefined {
  return ownerUserId === undefined ? undefined : { ownerUserId };
}

/** Exported for focused source tests and to keep invalid-file recovery deterministic. */
export function validateRiderPdf(file: Pick<File, "name" | "size" | "type">): string | null {
  const hasPdfExtension = /\.pdf$/i.test(file.name);
  const hasPdfMimeType = file.type === "application/pdf";

  if (!hasPdfExtension && !hasPdfMimeType) {
    return "Choose a PDF file.";
  }
  if (file.size <= 0) {
    return "Choose a non-empty PDF file.";
  }
  if (file.size > RIDER_PDF_MAX_BYTES) {
    return `PDFs must be ${MAX_UPLOAD_LABEL} or smaller.`;
  }
  return null;
}

/**
 * A false value is intentional when context is loading/refetching or belongs to a previous owner.
 * This fail-closed guard prevents a stale cache entry from revealing or requesting another library.
 */
export function canUseUploadedRiderLibrary(
  context: RiderDocumentContext | null | undefined,
  requestedOwnerUserId: number | undefined,
  isFetching: boolean,
): boolean {
  if (isFetching || !context) return false;
  if (requestedOwnerUserId !== undefined && context.ownerUserId !== requestedOwnerUserId) return false;
  return context.canManage;
}

function baseName(fileName: string): string {
  const name = fileName.replace(/\.pdf$/i, "").trim();
  return name || "Untitled rider";
}

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`;
  const kb = byteSize / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function pdfToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The PDF could not be read. Please choose it again."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("The PDF could not be read. Please choose it again."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Private, versioned PDF rider management. Server authorization remains authoritative; this client
 * only waits for a confirmed usable context before it ever asks for a document list.
 */
export function UploadedRiderLibrary({
  ownerUserId,
  enabled,
  uploadRequestToken = 0,
  onCapabilityChange,
}: UploadedRiderLibraryProps) {
  const riderDocuments = trpc.riderDocuments;
  const contextInput = useMemo(() => ownerInput(ownerUserId), [ownerUserId]);
  const contextQuery = riderDocuments.context.useQuery(contextInput, {
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const usableContext = enabled && contextQuery.isSuccess && canUseUploadedRiderLibrary(
    contextQuery.data as RiderDocumentContext | undefined,
    ownerUserId,
    contextQuery.isFetching,
  );
  const listQuery = riderDocuments.list.useQuery(contextInput, {
    enabled: usableContext,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const uploadMutation = riderDocuments.upload.useMutation();
  const replaceMutation = riderDocuments.replace.useMutation();
  const setDefaultMutation = riderDocuments.setDefault.useMutation();
  const clearDefaultMutation = riderDocuments.clearDefault.useMutation();
  const archiveMutation = riderDocuments.archive.useMutation();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<RiderDocumentSummary | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<RiderDocumentSummary | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const busyRef = useRef(false);
  const actionErrorRef = useRef<unknown>(null);
  const [replaceNeedsReload, setReplaceNeedsReload] = useState(false);
  const handledUploadRequest = useRef(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const context = contextQuery.data as RiderDocumentContext | undefined;
  const contextResolved = enabled && contextQuery.isSuccess && !contextQuery.isFetching;
  const capability = useMemo<UploadedRiderLibraryCapability>(
    () => ({ ready: contextResolved, canUpload: usableContext && !!context?.planAllowed }),
    [context?.planAllowed, contextResolved, usableContext],
  );

  useEffect(() => {
    onCapabilityChange?.(capability);
  }, [capability, onCapabilityChange]);

  useEffect(() => {
    if (
      uploadRequestToken > 0
      && uploadRequestToken !== handledUploadRequest.current
      && usableContext
      && context?.planAllowed
      && !busyRef.current
    ) {
      handledUploadRequest.current = uploadRequestToken;
      setUploadError(null);
      setUploadOpen(true);
    }
  }, [context?.planAllowed, uploadRequestToken, usableContext]);

  useEffect(() => {
    // Switching team context must never leave a previously-selected PDF in the next owner's modal.
    setUploadOpen(false);
    setReplaceTarget(null);
    setArchiveTarget(null);
    setUploadFile(null);
    setReplaceFile(null);
    setUploadError(null);
    setReplaceError(null);
    setUploadTitle("");
  }, [ownerUserId]);

  const isBusy = busyAction !== null;

  const runAction = async (action: string, operation: () => Promise<unknown>): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    actionErrorRef.current = null;
    setBusyAction(action);
    try {
      await operation();
      await listQuery.refetch();
      return true;
    } catch (error) {
      actionErrorRef.current = error;
      toast.error(getErrorMessage(error, "Unable to update uploaded riders."));
      return false;
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  const clearUploadDraft = () => {
    if (busyRef.current) return;
    setUploadOpen(false);
    setUploadTitle("");
    setUploadFile(null);
    setUploadError(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const clearReplaceDraft = () => {
    if (busyRef.current) return;
    setReplaceTarget(null);
    setReplaceNeedsReload(false);
    setReplaceFile(null);
    setReplaceError(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  const chooseUploadFile = (file: File | undefined) => {
    if (isBusy || busyRef.current) return;
    if (!file) return;
    const validationError = validateRiderPdf(file);
    if (validationError) {
      setUploadFile(null);
      setUploadError(validationError);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      return;
    }
    setUploadFile(file);
    setUploadError(null);
    if (!uploadTitle.trim()) setUploadTitle(baseName(file.name));
    // Clearing the native field allows choosing the same file after a failed attempt.
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const chooseReplaceFile = (file: File | undefined) => {
    if (isBusy || busyRef.current) return;
    if (!file) return;
    const validationError = validateRiderPdf(file);
    if (validationError) {
      setReplaceFile(null);
      setReplaceError(validationError);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
      return;
    }
    setReplaceFile(file);
    setReplaceError(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  const saveUpload = async () => {
    if (isBusy || busyRef.current) return;
    if (!uploadFile) {
      setUploadError("Choose a PDF to upload.");
      return;
    }
    const title = uploadTitle.trim();
    if (!title) {
      setUploadError("Enter a title for this rider.");
      return;
    }
    const success = await runAction("upload", async () => {
      const pdfBase64 = await pdfToBase64(uploadFile);
      return uploadMutation.mutateAsync({
        ...ownerInput(ownerUserId),
        title,
        fileName: uploadFile.name,
        pdfBase64,
      });
    });
    if (success) {
      toast.success("PDF rider uploaded");
      clearUploadDraft();
    } else {
      // Retain title and selected file so a transient server error can be retried without re-entry.
      setUploadError("Upload failed. Your title and PDF are still ready to retry.");
    }
  };

  const saveReplacement = async () => {
    if (isBusy || busyRef.current || !replaceTarget || replaceNeedsReload) return;
    if (!replaceFile) {
      setReplaceError("Choose a replacement PDF.");
      return;
    }
    const success = await runAction("replace", async () => {
      const pdfBase64 = await pdfToBase64(replaceFile);
      return replaceMutation.mutateAsync({
        ...ownerInput(ownerUserId),
        documentId: replaceTarget.id,
        expectedRevision: replaceTarget.revision,
        fileName: replaceFile.name,
        pdfBase64,
      });
    });
    if (success) {
      toast.success("PDF rider replaced");
      clearReplaceDraft();
    } else {
      // Keep the file selected to make retry safe and explicit.
      const error = actionErrorRef.current as { data?: { code?: string } } | null;
      const conflict = error?.data?.code === "CONFLICT";
      setReplaceNeedsReload(conflict);
      setReplaceError(conflict
        ? "This rider changed. Reload its current version, review it, then save. Your selected PDF is retained."
        : "Replacement failed. Your selected PDF is still ready to retry.");
    }
  };

  const reloadReplacement = async () => {
    if (!replaceTarget || busyRef.current) return;
    const targetId = replaceTarget.id;
    const result = await listQuery.refetch();
    const current = result.data?.documents.find((row) => row.id === targetId);
    if (result.error || !current) {
      setReplaceError("The current rider could not be loaded. Keep your PDF and retry, or cancel.");
      return;
    }
    setReplaceTarget(current);
    setReplaceNeedsReload(false);
    setReplaceError(null);
  };

  const setDefault = async (document: RiderDocumentSummary) => {
    if (isBusy || busyRef.current) return;
    if (document.isDefault) {
      const success = await runAction("clear-default", () => clearDefaultMutation.mutateAsync(ownerInput(ownerUserId)));
      if (success) toast.success("Default PDF rider cleared");
      return;
    }
    const success = await runAction("set-default", () => setDefaultMutation.mutateAsync({
      ...ownerInput(ownerUserId),
      documentId: document.id,
      expectedRevision: document.revision,
    }));
    if (success) toast.success("Default PDF rider set");
  };

  const archiveDocument = async () => {
    if (isBusy || !archiveTarget) return;
    const target = archiveTarget;
    const success = await runAction("archive", () => archiveMutation.mutateAsync({
      ...ownerInput(ownerUserId),
      documentId: target.id,
      expectedRevision: target.revision,
    }));
    if (success) {
      toast.success("PDF rider removed from the library");
      setArchiveTarget(null);
    }
  };

  if (!enabled) {
    return null;
  }

  if (contextQuery.isLoading || contextQuery.isFetching) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking uploaded rider access…
        </CardContent>
      </Card>
    );
  }

  if (contextQuery.isError || !context) {
    return (
      <Card className="mt-6 border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20">
        <CardContent className="py-5 text-sm text-amber-900 dark:text-amber-100">
          Uploaded PDF riders are unavailable right now. Please refresh and try again.
        </CardContent>
      </Card>
    );
  }

  if (!context.canManage) {
    return (
      <Card className="mt-6 border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Uploaded Riders</CardTitle>
          <CardDescription>Private PDF riders for {context.artistName}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You do not have permission to manage this artist’s uploaded riders.
        </CardContent>
      </Card>
    );
  }

  const documents = listQuery.data?.documents ?? [];

  return (
    <section className="mt-6" aria-labelledby="uploaded-riders-heading">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle id="uploaded-riders-heading" className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5 text-purple-600" /> Uploaded Riders
            </CardTitle>
            <CardDescription className="mt-1">
              Private PDF riders for {context.artistName}. Current versions can be attached to new bookings.
            </CardDescription>
          </div>
          <Button type="button" size="sm" className="w-full shrink-0 gap-2 sm:w-auto" onClick={() => setUploadOpen(true)} disabled={isBusy || !context.planAllowed}>
            <Upload className="h-4 w-4" /> Upload PDF
          </Button>
        </CardHeader>
        <CardContent>
          {!context.planAllowed && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
              New uploads, replacements, and selecting a new default require the owner’s Starter plan or higher. The effective owner plan is {context.tier}; ask the account owner to review their plan.
            </div>
          )}
          {listQuery.isLoading || listQuery.isFetching ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading uploaded riders…
            </div>
          ) : listQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium">Unable to load uploaded riders.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => listQuery.refetch()} disabled={isBusy}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <FileText className="mx-auto h-9 w-9 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No uploaded PDF riders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload a private PDF rider to keep a versioned booking-ready copy here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => {
                const previewPath = riderPdfDownloadPath(document.currentVersionId, undefined, true);
                const downloadPath = riderPdfDownloadPath(document.currentVersionId);
                return (
                  <article key={document.id} className="rounded-lg border p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">PDF</span>
                            {document.isDefault && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100">
                                <Star className="mr-1 h-3 w-3 fill-current" /> Default
                              </Badge>
                            )}
                          </div>
                          <h3 className="mt-0.5 break-words font-semibold">{document.title}</h3>
                          <p className="mt-1 break-all text-xs text-muted-foreground">{document.fileName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Current version {document.versionNumber} · {document.pageCount} {document.pageCount === 1 ? "page" : "pages"} · {formatBytes(document.byteSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:justify-end">
                        <Button asChild type="button" variant="outline" size="sm" disabled={isBusy}>
                          <a href={previewPath} target="_blank" rel="noreferrer" aria-label={`Preview ${document.title} PDF`}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                          </a>
                        </Button>
                        <Button asChild type="button" variant="outline" size="sm" disabled={isBusy}>
                          <a href={downloadPath} aria-label={`Download ${document.title} PDF`}>
                            <Download className="mr-1 h-3.5 w-3.5" /> Download
                          </a>
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setReplaceError(null); setReplaceNeedsReload(false); setReplaceFile(null); setReplaceTarget(document); }} disabled={isBusy || !context.planAllowed}>
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={document.isDefault ? "border-amber-300 text-amber-700 hover:text-amber-800" : ""}
                          onClick={() => setDefault(document)}
                          disabled={isBusy || (!document.isDefault && !context.planAllowed)}
                        >
                          <Star className={`mr-1 h-3.5 w-3.5 ${document.isDefault ? "fill-current" : ""}`} />
                          {document.isDefault ? "Clear default" : "Set default"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setArchiveTarget(document)} disabled={isBusy}>
                          <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={(open) => { if (open) setUploadOpen(true); else clearUploadDraft(); }}>
        <DialogContent overlayClassName="z-[70]" className="z-[71] sm:max-w-md" showCloseButton={!isBusy} onEscapeKeyDown={(event) => { if (busyRef.current) event.preventDefault(); }} onPointerDownOutside={(event) => { if (busyRef.current) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Upload PDF Rider</DialogTitle>
            <DialogDescription>Save a private, versioned PDF rider. PDFs must be {MAX_UPLOAD_LABEL} or smaller.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uploaded-rider-title">Title</Label>
              <Input id="uploaded-rider-title" value={uploadTitle} onChange={(event) => { setUploadTitle(event.target.value); setUploadError(null); }} placeholder="e.g., 2026 Hospitality Rider" disabled={isBusy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploaded-rider-file">PDF file</Label>
              <Input ref={uploadInputRef} id="uploaded-rider-file" type="file" accept="application/pdf,.pdf" onChange={(event) => chooseUploadFile(event.target.files?.[0])} disabled={isBusy} />
              {uploadFile && <p className="text-xs text-muted-foreground">Selected: {uploadFile.name} · {formatBytes(uploadFile.size)}</p>}
            </div>
            {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={clearUploadDraft} disabled={isBusy}>Cancel</Button>
            <Button type="button" onClick={saveUpload} disabled={isBusy || !uploadFile || !uploadTitle.trim()}>
              {busyAction === "upload" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Save Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!replaceTarget} onOpenChange={(open) => { if (!open) clearReplaceDraft(); }}>
        <DialogContent overlayClassName="z-[70]" className="z-[71] sm:max-w-md" showCloseButton={!isBusy} onEscapeKeyDown={(event) => { if (busyRef.current) event.preventDefault(); }} onPointerDownOutside={(event) => { if (busyRef.current) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Replace PDF Rider</DialogTitle>
            <DialogDescription>
              Replace the current PDF for <span className="font-medium text-foreground">{replaceTarget?.title}</span>. Previous booking versions remain unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="replacement-rider-file">Replacement PDF</Label>
            <Input ref={replaceInputRef} id="replacement-rider-file" type="file" accept="application/pdf,.pdf" onChange={(event) => chooseReplaceFile(event.target.files?.[0])} disabled={isBusy} />
            {replaceFile && <p className="text-xs text-muted-foreground">Selected: {replaceFile.name} · {formatBytes(replaceFile.size)}</p>}
            {replaceError && <p role="alert" className="text-sm text-destructive">{replaceError}</p>}
            {replaceNeedsReload && <Button type="button" variant="outline" onClick={reloadReplacement} disabled={isBusy}>Reload current version</Button>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={clearReplaceDraft} disabled={isBusy}>Cancel</Button>
            <Button type="button" onClick={saveReplacement} disabled={isBusy || !replaceFile || replaceNeedsReload}>
              {busyAction === "replace" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Replace PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => { if (!open && !busyRef.current) setArchiveTarget(null); }}>
        <AlertDialogContent overlayClassName="z-[70]" className="z-[71]">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this PDF rider?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <span className="font-medium text-foreground">{archiveTarget?.title}</span> from the library. It does not destroy any booking attachment or its retained version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void archiveDocument(); }} disabled={isBusy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busyAction === "archive" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Archive PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
