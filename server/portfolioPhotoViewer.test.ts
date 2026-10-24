import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getPortfolioPhotoViewerState,
  type PortfolioPhoto,
} from "../client/src/components/PortfolioPhotoViewer";

const viewerSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/PortfolioPhotoViewer.tsx"),
  "utf8",
);

const photos: readonly PortfolioPhoto[] = [
  { id: 11, photoUrl: "/manus-storage/portrait-one.jpg", caption: "First image" },
  { id: 22, photoUrl: "/manus-storage/portrait-two.jpg", caption: "Second image" },
  { id: 33, photoUrl: "/manus-storage/portrait-three.jpg" },
];

describe("PortfolioPhotoViewer controlled state", () => {
  it("opens only for a selected photo in the currently loaded collection", () => {
    const openViewer = getPortfolioPhotoViewerState(photos, 22);
    const closedViewer = getPortfolioPhotoViewerState(photos, 999);
    const noSelection = getPortfolioPhotoViewerState(photos, null);

    expect(openViewer).toMatchObject({
      isOpen: true,
      currentIndex: 1,
      currentPhoto: photos[1],
      loadedCount: 3,
      canGoPrevious: true,
      canGoNext: true,
    });
    expect(closedViewer).toMatchObject({
      isOpen: false,
      currentIndex: -1,
      currentPhoto: null,
      loadedCount: 3,
      canGoPrevious: false,
      canGoNext: false,
    });
    expect(noSelection.isOpen).toBe(false);
  });

  it("sets previous and next boundaries without selecting outside the collection", () => {
    const first = getPortfolioPhotoViewerState(photos, 11);
    const last = getPortfolioPhotoViewerState(photos, 33);
    const empty = getPortfolioPhotoViewerState([], 11);

    expect(first).toMatchObject({ currentIndex: 0, canGoPrevious: false, canGoNext: true });
    expect(last).toMatchObject({ currentIndex: 2, canGoPrevious: true, canGoNext: false });
    expect(empty).toMatchObject({
      isOpen: false,
      loadedCount: 0,
      currentIndex: -1,
      canGoPrevious: false,
      canGoNext: false,
    });
  });
});

describe("PortfolioPhotoViewer UI contract", () => {
  it("keeps the exact reusable controlled prop contract", () => {
    expect(viewerSource).toContain("photos: readonly PortfolioPhoto[];");
    expect(viewerSource).toContain("selectedId: number | null;");
    expect(viewerSource).toContain("onClose: () => void;");
    expect(viewerSource).toContain("onSelect: (id: number) => void;");
    expect(viewerSource).toContain("returnFocusRef?: React.RefObject<HTMLElement | null>;");
    expect(viewerSource).toContain("open={isOpen}");
    expect(viewerSource).toContain("if (!open) onClose();");
  });

  it("uses the accessible dialog foundation and places it over the terms notice", () => {
    expect(viewerSource).toContain("DialogContent");
    expect(viewerSource).toContain("<DialogTitle");
    expect(viewerSource).toContain("<DialogDescription");
    expect(viewerSource).toContain("Use arrows to browse photos. Escape closes the viewer.");
    expect(viewerSource).toContain('aria-label="Close photo viewer"');
    expect(viewerSource).toContain('aria-label="Previous photo"');
    expect(viewerSource).toContain('aria-label="Next photo"');
    expect(viewerSource).toContain('overlayClassName="z-[80] bg-black/85"');
    expect(viewerSource).toContain('className="z-[80] flex h-[calc(100dvh-1rem)]');
    expect(viewerSource).toContain("onCloseAutoFocus={restoreFocus}");
    expect(viewerSource).toContain("thumbnail.focus();");
  });

  it("preserves original image framing and supplies safe keyboard and image-failure behavior", () => {
    expect(viewerSource).toContain('event.key !== "ArrowLeft" && event.key !== "ArrowRight"');
    expect(viewerSource).toContain("event.preventDefault();");
    expect(viewerSource).toContain("selectRelativePhoto(event.key === \"ArrowLeft\" ? -1 : 1)");
    expect(viewerSource).toContain("disabled={!canGoPrevious}");
    expect(viewerSource).toContain("disabled={!canGoNext}");
    expect(viewerSource).toContain("Photo {currentIndex + 1} of {loadedCount}");
    expect(viewerSource).toContain("src={currentPhoto.photoUrl}");
    expect(viewerSource).toContain("object-contain");
    expect(viewerSource).toContain("Retry image");
    expect(viewerSource).toContain("onError={handleImageError}");
    expect(viewerSource).toContain("break-words");
    expect(viewerSource).not.toMatch(/\bfetch\s*\(/);
    expect(viewerSource).not.toMatch(/document\.body\.style/);
    expect(viewerSource).not.toMatch(/cache-buster|URLSearchParams/);
  });
});
