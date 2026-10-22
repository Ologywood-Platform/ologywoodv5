import { CircleHelp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** A static explainer; it deliberately performs no portfolio requests. */
export default function VideoPortfolioQuickGuide() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2 text-xs"
          aria-label="How video portfolio editing and ordering works"
        >
          <CircleHelp className="mr-1 h-4 w-4" />
          How this works
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[71] max-w-[calc(100vw-2rem)] text-sm">
        <p className="font-medium">Manage your video portfolio</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
          <li>Edit a clip title without changing its video or share link.</li>
          <li>Drag on desktop, or use Move Up and Move Down on mobile or with a keyboard.</li>
          <li>Choose Save to publish changes. Cancel keeps your public portfolio unchanged.</li>
        </ul>
        <Link
          href="/help?article=video-portfolio-manage-guide"
          className="mt-3 inline-block font-medium text-primary underline underline-offset-2"
        >
          Read the full guide
        </Link>
      </PopoverContent>
    </Popover>
  );
}
