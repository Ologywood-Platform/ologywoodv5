import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type PortfolioPhoto = {
  id: number;
  photoUrl: string;
  caption?: string | null;
};

export interface PortfolioPhotoViewerProps {
  photos: readonly PortfolioPhoto[];
  selectedId: number | null;
  onClose: () => void;
  onSelect: (id: number) => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export type PortfolioPhotoViewerState = {
  currentPhoto: PortfolioPhoto | null;
  currentIndex: number;
  isOpen: boolean;
  loadedCount: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

/**
 * Derives controlled-viewer state without retaining a duplicate selected-photo state.
 * Keeping this pure makes selection resilient when a refreshed gallery removes a photo.
 */
export function getPortfolioPhotoViewerState(
  photos: readonly PortfolioPhoto[],
  selectedId: number | null,
): PortfolioPhotoViewerState {
  const currentIndex = selectedId === null
    ? -1
    : photos.findIndex((photo) => photo.id === selectedId);
  const currentPhoto = currentIndex >= 0 ? photos[currentIndex] ?? null : null;

  return {
    currentPhoto,
    currentIndex,
    isOpen: currentPhoto !== null,
    loadedCount: photos.length,
    canGoPrevious: currentIndex > 0,
    canGoNext: currentIndex >= 0 && currentIndex < photos.length - 1,
  };
}

type ImageStatus = {
  photoId: number;
  photoUrl: string;
  failed: boolean;
  retryCount: number;
};

export function PortfolioPhotoViewer({
  photos,
  selectedId,
  onClose,
  onSelect,
  returnFocusRef,
}: PortfolioPhotoViewerProps) {
  const { currentPhoto, currentIndex, isOpen, loadedCount, canGoPrevious, canGoNext } =
    getPortfolioPhotoViewerState(photos, selectedId);
  const [imageStatus, setImageStatus] = React.useState<ImageStatus | null>(null);

  const hasCurrentImageFailed = currentPhoto !== null
    && imageStatus?.photoId === currentPhoto.id
    && imageStatus.photoUrl === currentPhoto.photoUrl
    && imageStatus.failed;
  const imageRetryCount = currentPhoto !== null
    && imageStatus?.photoId === currentPhoto.id
    && imageStatus.photoUrl === currentPhoto.photoUrl
    ? imageStatus.retryCount
    : 0;

  const selectRelativePhoto = React.useCallback((offset: -1 | 1) => {
    const nextIndex = currentIndex + offset;
    const nextPhoto = photos[nextIndex];

    if (nextPhoto) {
      onSelect(nextPhoto.id);
    }
  }, [currentIndex, onSelect, photos]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    // Arrow keys scroll the page by default. The viewer owns these while it is open,
    // including at the first and last images where there is no further selection.
    event.preventDefault();
    selectRelativePhoto(event.key === "ArrowLeft" ? -1 : 1);
  }, [selectRelativePhoto]);

  const handleImageError = React.useCallback(() => {
    if (!currentPhoto) return;

    setImageStatus((previousStatus) => ({
      photoId: currentPhoto.id,
      photoUrl: currentPhoto.photoUrl,
      failed: true,
      retryCount:
        previousStatus?.photoId === currentPhoto.id
        && previousStatus.photoUrl === currentPhoto.photoUrl
          ? previousStatus.retryCount
          : 0,
    }));
  }, [currentPhoto]);

  const retryImage = React.useCallback(() => {
    if (!currentPhoto) return;

    setImageStatus((previousStatus) => ({
      photoId: currentPhoto.id,
      photoUrl: currentPhoto.photoUrl,
      failed: false,
      // Remounting the image retries the exact original URL unchanged.
      retryCount:
        previousStatus?.photoId === currentPhoto.id
        && previousStatus.photoUrl === currentPhoto.photoUrl
          ? previousStatus.retryCount + 1
          : 1,
    }));
  }, [currentPhoto]);

  const restoreFocus = React.useCallback((event: Event) => {
    const thumbnail = returnFocusRef?.current;
    if (!thumbnail) return;

    event.preventDefault();
    thumbnail.focus();
  }, [returnFocusRef]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {currentPhoto && (
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[80] bg-black/85"
          onCloseAutoFocus={restoreFocus}
          onKeyDown={handleKeyDown}
          className="z-[80] flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-6xl sm:max-w-6xl flex-col gap-0 overflow-hidden rounded-xl border-zinc-700/80 bg-zinc-950 p-0 text-zinc-100 shadow-2xl"
        >
          <header className="flex min-w-0 items-start justify-between gap-3 border-b border-zinc-700/80 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <DialogTitle className="text-base text-zinc-50">
                Portfolio photo viewer
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-zinc-300">
                Use arrows to browse photos. Escape closes the viewer.
              </DialogDescription>
            </div>
            <DialogClose
              aria-label="Close photo viewer"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-zinc-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogClose>
          </header>

          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 sm:p-4"
          >
            {hasCurrentImageFailed ? (
              <div className="flex max-w-md flex-col items-center gap-3 px-4 text-center">
                <p className="text-sm text-zinc-200" role="alert">
                  This photo could not be loaded.
                </p>
                <button
                  type="button"
                  onClick={retryImage}
                  className="rounded-md border border-zinc-500 px-3 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Retry image
                </button>
              </div>
            ) : (
              <img
                key={`${currentPhoto.id}-${imageRetryCount}`}
                src={currentPhoto.photoUrl}
                alt={currentPhoto.caption || `Portfolio photo ${currentIndex + 1}`}
                className="block h-full max-h-full w-full max-w-full object-contain"
                onError={handleImageError}
              />
            )}
          </div>

          <footer className="shrink-0 border-t border-zinc-700/80 px-3 py-3 sm:px-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <button
                type="button"
                aria-label="Previous photo"
                disabled={!canGoPrevious}
                onClick={() => selectRelativePhoto(-1)}
                className="inline-flex min-w-0 justify-self-start items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <p className="whitespace-nowrap text-center text-sm tabular-nums text-zinc-200" aria-live="polite">
                Photo {currentIndex + 1} of {loadedCount}
              </p>
              <button
                type="button"
                aria-label="Next photo"
                disabled={!canGoNext}
                onClick={() => selectRelativePhoto(1)}
                className="inline-flex min-w-0 justify-self-end items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <span>Next</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            {currentPhoto.caption && (
              <p className="mt-2 max-h-[20dvh] max-w-full overflow-y-auto break-words text-center text-sm leading-5 text-zinc-300">
                {currentPhoto.caption}
              </p>
            )}
          </footer>
        </DialogContent>
      )}
    </Dialog>
  );
}
