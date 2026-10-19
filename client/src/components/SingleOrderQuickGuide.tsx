import { useId } from "react";
import { CircleHelp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ReleaseOrderKind } from "@shared/releaseOrder";

export const SINGLE_ORDER_HELP_HREF = "/help?article=reorder-profile-singles#reorder-profile-singles";

/** Static guidance only: opening this guide never reads or changes an order. */
export default function SingleOrderQuickGuide({ kind }: { kind: ReleaseOrderKind }) {
  const headingId = useId();
  const section = kind === "music" ? "Music Releases" : "Content Releases";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" className="gap-1.5" aria-label={`How to reorder singles in ${section}`} title="Open the single reordering quick guide">
          <CircleHelp className="h-4 w-4" aria-hidden="true" /> How to reorder
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={16} className="z-[71] w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto text-sm" aria-labelledby={headingId}>
        <h3 id={headingId} className="mb-3 font-semibold">Arrange your singles in 3 steps</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>In <strong>{section}</strong>, choose <strong>Reorder Singles</strong>. Only published singles appear.</li>
          <li>Drag the grip handle on desktop, or use <strong>Move Up</strong> and <strong>Move Down</strong> on mobile or with your keyboard.</li>
          <li>Choose <strong>Save Order</strong> to update this section of your profile. <strong>Cancel</strong> discards unsaved moves.</li>
        </ol>
        <p className="mt-3 text-muted-foreground"><strong>Reset to Newest</strong> appears after a custom order is saved and resets the published-single order to newest first after confirmation. Newly published singles appear after your saved order; you can arrange them any time.</p>
        <p className="mt-2 text-muted-foreground">Only the creator profile owner can save an order. Prices, purchases, and fan playlists do not change.</p>
        <a href={SINGLE_ORDER_HELP_HREF} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4" aria-label="Read the full single reordering guide (opens in a new tab)">
          Read the full guide <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </PopoverContent>
    </Popover>
  );
}
