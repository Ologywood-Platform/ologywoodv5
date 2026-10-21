import { useId } from "react";
import { CircleHelp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const RIDER_UPLOAD_HELP_HREF = "/help?article=rider-upload-guide#rider-upload-guide";

/** Static help only: opening this guide never fetches, uploads, or changes a rider. */
export default function RiderUploadQuickGuide() {
  const headingId = useId();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="grow gap-1.5 sm:grow-0" aria-label="How this works: uploaded PDF riders" title="Open the uploaded rider quick guide">
          <CircleHelp className="h-4 w-4" aria-hidden="true" /> How this works
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={16} className="z-[71] w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto text-sm" style={{ maxHeight: "min(calc(100dvh - 2rem), var(--radix-popover-content-available-height))" }} aria-labelledby={headingId}>
        <h3 id={headingId} className="mb-3 font-semibold">Upload and use your own rider</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Prepare a <strong>plain PDF</strong>, up to <strong>10 MB and 100 pages</strong>. If it has a password, forms, links, scripts, or attachments, export or print a plain PDF first.</li>
          <li>In <strong>Uploaded Riders</strong>, choose <strong>Upload PDF</strong>, add a title, select your file, and choose <strong>Save Upload</strong>.</li>
          <li>With the owner’s <strong>Starter-or-higher</strong> plan, choose <strong>Set default</strong> for new bookings, or <strong>Attach PDF</strong> inside a booking. Existing bookings do not change automatically.</li>
        </ol>
        <p className="mt-3"><strong>Working with a manager?</strong> The talent owner enables <strong>Manage Riders</strong> in Team Management. The manager opens the owner’s library from <strong>Team Workspace</strong> and uses the owner’s <strong>Starter-or-higher</strong> plan—not a separate paid account.</p>
        <p className="mt-3 text-muted-foreground"><strong>Replace</strong> saves a new version; older booking PDFs stay unchanged. <strong>Archive</strong> removes future library availability, not historical booking attachments.</p>
        <p className="mt-2 text-muted-foreground">Riders are private to authorized owners/managers and participants in bookings where a version is attached. Uploading does not sign a contract or change its price.</p>
        <a href={RIDER_UPLOAD_HELP_HREF} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4" aria-label="Read the full uploaded rider guide (opens in a new tab)">
          Read the full guide <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </PopoverContent>
    </Popover>
  );
}
