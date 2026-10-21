import { useMemo, useState } from "react";
import { FileText, Loader2, Paperclip, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { riderPdfDownloadPath } from "@shared/riderDocuments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = { bookingId: number };

function bytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** Supplemental uploaded rider PDFs only; intentionally separate from contract/signing UI. */
export function BookingRiderDocuments({ bookingId }: Props) {
  // riderDocuments is mounted concurrently with this feature. The local cast
  // keeps this isolated booking card buildable during router composition.
  const riderDocuments = (trpc as any).riderDocuments;
  const utils = trpc.useUtils();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirming, setConfirming] = useState<any | null>(null);
  const context = trpc.bookingRiderDocuments.context.useQuery({ bookingId }, { enabled: bookingId > 0 });
  const documents = trpc.bookingRiderDocuments.list.useQuery({ bookingId }, { enabled: bookingId > 0 });
  // Keep this disabled until the action is explicitly opened: a venue can read
  // linked PDFs but must never be able to enumerate a talent's private library.
  const ownerDocuments = riderDocuments.list.useQuery(
    { ownerUserId: context.data?.ownerUserId ?? 0 },
    { enabled: pickerOpen && context.data?.canAttach === true && !!context.data?.ownerUserId },
  );
  const attach = trpc.bookingRiderDocuments.attach.useMutation({
    onSuccess: () => {
      toast.success("Rider document attached to this booking");
      setConfirming(null);
      setPickerOpen(false);
      void utils.bookingRiderDocuments.list.invalidate({ bookingId });
    },
    onError: (error) => toast.error(error.message || "Could not attach rider document"),
  });
  const attachedVersions = useMemo(() => new Set((documents.data ?? []).map((item) => item.versionId)), [documents.data]);

  if (context.isLoading || documents.isLoading) {
    return <Card><CardContent className="py-6 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  }
  // Security errors should not turn into a fake empty rider list.
  if (context.error || documents.error) return null;

  const attached = documents.data ?? [];
  return <>
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><Paperclip className="h-5 w-5" />Uploaded Rider Documents</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Supplemental technical and hospitality PDF requirements. These documents do not alter the booking contract or signatures.</p>
          </div>
          {context.data?.canAttach && <Button size="sm" className="shrink-0 gap-2" onClick={() => setPickerOpen(true)}><Paperclip className="h-4 w-4" />Attach PDF</Button>}
        </div>
      </CardHeader>
      <CardContent>
        {attached.length === 0 ? <p className="text-sm text-muted-foreground">No uploaded rider documents are attached to this booking.</p> : (
          <div className="space-y-3">
            {attached.map((item) => {
              const viewPath = riderPdfDownloadPath(item.versionId, bookingId, true);
              const downloadPath = riderPdfDownloadPath(item.versionId, bookingId);
              return <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                <FileText className="h-5 w-5 shrink-0 text-purple-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.fileName} · {bytes(item.byteSize)} · {item.pageCount} page{item.pageCount === 1 ? "" : "s"} · Locked version {item.versionNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">Attached {new Date(item.attachedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1" asChild><a href={viewPath} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" />Preview</a></Button>
                  <Button size="sm" variant="outline" className="gap-1" asChild><a href={downloadPath}><ExternalLink className="h-3.5 w-3.5" />Download</a></Button>
                </div>
              </div>;
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={pickerOpen} onOpenChange={(open) => { setPickerOpen(open); if (!open) setConfirming(null); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Attach an uploaded rider PDF</DialogTitle><DialogDescription>Review the PDF before sharing it with this booking. Attached versions remain locked even if the library document is later replaced.</DialogDescription></DialogHeader>
        {ownerDocuments.isLoading ? <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : ownerDocuments.error ? <p className="text-sm text-destructive py-4">Could not load your rider library. Please try again.</p> : !ownerDocuments.data?.length ? <p className="text-sm text-muted-foreground py-4">No uploaded rider PDFs are available.</p> : <div className="max-h-80 overflow-y-auto space-y-2">
          {ownerDocuments.data.map((item: any) => {
            const alreadyAttached = attachedVersions.has(item.currentVersionId);
            return <button key={item.id} type="button" disabled={alreadyAttached || attach.isPending} onClick={() => setConfirming(item)} className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 disabled:opacity-50">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.fileName} · {bytes(item.byteSize)} · {item.pageCount} page{item.pageCount === 1 ? "" : "s"} · Version {item.versionNumber}{alreadyAttached ? " · Already attached" : ""}</p>
            </button>;
          })}
        </div>}
      </DialogContent>
    </Dialog>

    <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Share rider PDF with this booking?</DialogTitle><DialogDescription><strong>{confirming?.title}</strong> will be shared with everyone who can view this booking. The current PDF version will be retained even if you replace the library document later.</DialogDescription></DialogHeader>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button><Button disabled={attach.isPending} onClick={() => confirming && attach.mutate({ bookingId, documentId: confirming.id, expectedRevision: confirming.revision })}>{attach.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm attach</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}
