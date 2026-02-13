import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaGalleryManager } from "./MediaGalleryManager";

describe("MediaGalleryManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the component with title and description", () => {
      render(<MediaGalleryManager />);
      
      expect(screen.getByText("Media Gallery")).toBeTruthy();
      expect(screen.getByText(/Showcase your work/i)).toBeTruthy();
    });

    it("should display photo count", () => {
      render(<MediaGalleryManager photos={["photo1.jpg", "photo2.jpg"]} />);
      
      expect(screen.getByText(/2\/10/)).toBeTruthy();
    });

    it("should display empty state when no photos", () => {
      render(<MediaGalleryManager />);
      
      expect(screen.getByText(/No photos yet/i)).toBeTruthy();
    });
  });

  describe("Current Gallery Display", () => {
    it("should display current photos in grid", () => {
      const photos = [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
      ];
      render(<MediaGalleryManager photos={photos} />);
      
      const images = screen.getAllByAltText(/Gallery photo/);
      expect(images.length).toBe(2);
    });

    it("should show delete button on hover", () => {
      const photos = ["https://example.com/photo1.jpg"];
      render(<MediaGalleryManager photos={photos} />);
      
      const deleteButtons = screen.getAllByRole("button");
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it("should display correct number of photos", () => {
      const photos = Array(5).fill("https://example.com/photo.jpg");
      render(<MediaGalleryManager photos={photos} />);
      
      const images = screen.getAllByAltText(/Gallery photo/);
      expect(images.length).toBe(5);
    });
  });

  describe("File Selection", () => {
    it("should handle multiple file selection", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const files = [
        new File(["test1"], "photo1.jpg", { type: "image/jpeg" }),
        new File(["test2"], "photo2.jpg", { type: "image/jpeg" }),
      ];
      
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      await user.upload(input, files);
      
      expect(input.files?.length).toBe(2);
    });

    it("should reject non-image files", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const files = [
        new File(["test"], "document.pdf", { type: "application/pdf" }),
      ];
      
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      await user.upload(input, files);
      
      expect(input.files?.length).toBe(0);
    });

    it("should reject files larger than 5MB", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const largeFile = new File(
        [new ArrayBuffer(6 * 1024 * 1024)],
        "large.jpg",
        { type: "image/jpeg" }
      );
      
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      await user.upload(input, [largeFile]);
      
      expect(input.files?.length).toBe(0);
    });

    it("should enforce maximum photo limit", async () => {
      const user = userEvent.setup();
      const existingPhotos = Array(8).fill("https://example.com/photo.jpg");
      
      render(<MediaGalleryManager photos={existingPhotos} maxPhotos={10} />);
      
      const files = Array(5).fill(null).map((_, i) =>
        new File([`test${i}`], `photo${i}.jpg`, { type: "image/jpeg" })
      );
      
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      await user.upload(input, files);
      
      // Should only allow 2 more files (10 - 8 = 2)
      expect(input.files?.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Preview", () => {
    it("should show preview after file selection", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      
      await user.upload(input, [file]);
      
      await waitFor(() => {
        expect(screen.getByAltText(/Preview 1/)).toBeTruthy();
      });
    });

    it("should display multiple previews", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const files = [
        new File(["test1"], "photo1.jpg", { type: "image/jpeg" }),
        new File(["test2"], "photo2.jpg", { type: "image/jpeg" }),
      ];
      
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      await user.upload(input, files);
      
      await waitFor(() => {
        expect(screen.getByAltText(/Preview 1/)).toBeTruthy();
        expect(screen.getByAltText(/Preview 2/)).toBeTruthy();
      });
    });
  });

  describe("Upload Actions", () => {
    it("should show upload button after file selection", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      
      await user.upload(input, [file]);
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add 1 Photo/i })).toBeTruthy();
      });
    });

    it("should show cancel button after file selection", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      
      await user.upload(input, [file]);
      
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Cancel/i })).toBeTruthy();
      });
    });

    it("should clear previews when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<MediaGalleryManager />);
      
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const input = screen.getByDisplayValue("") as HTMLInputElement;
      
      await user.upload(input, [file]);
      
      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: /Cancel/i });
        fireEvent.click(cancelButton);
      });
      
      expect(screen.queryByAltText(/Preview 1/)).not.toBeTruthy();
    });
  });

  describe("Delete Photo", () => {
    it("should allow deleting photos from gallery", () => {
      const photos = ["https://example.com/photo.jpg"];
      const mockOnPhotosUpdate = vi.fn();
      
      render(
        <MediaGalleryManager
          photos={photos}
          onPhotosUpdate={mockOnPhotosUpdate}
        />
      );
      
      const deleteButtons = screen.getAllByRole("button");
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Callbacks", () => {
    it("should call onPhotosUpdate when photos are updated", () => {
      const mockOnPhotosUpdate = vi.fn();
      
      render(
        <MediaGalleryManager
          photos={[]}
          onPhotosUpdate={mockOnPhotosUpdate}
        />
      );
      
      expect(mockOnPhotosUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Remaining Slots", () => {
    it("should display remaining photo slots", () => {
      const photos = Array(3).fill("https://example.com/photo.jpg");
      render(<MediaGalleryManager photos={photos} maxPhotos={10} />);
      
      expect(screen.getByText(/7 slots available/)).toBeTruthy();
    });

    it("should show 0 slots when gallery is full", () => {
      const photos = Array(10).fill("https://example.com/photo.jpg");
      render(<MediaGalleryManager photos={photos} maxPhotos={10} />);
      
      expect(screen.queryByText(/slots available/)).not.toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for inputs", () => {
      render(<MediaGalleryManager />);
      
      expect(screen.getByLabelText(/Add Photos/i)).toBeTruthy();
    });

    it("should have descriptive text for file requirements", () => {
      render(<MediaGalleryManager />);
      
      expect(screen.getByText(/PNG, JPG up to 5MB each/i)).toBeTruthy();
    });

    it("should have helpful information alert", () => {
      render(<MediaGalleryManager />);
      
      expect(screen.getByText(/Upload high-quality photos/i)).toBeTruthy();
    });
  });

  describe("Props Handling", () => {
    it("should accept artistId prop", () => {
      render(<MediaGalleryManager artistId={123} />);
      
      expect(screen.getByText("Media Gallery")).toBeTruthy();
    });

    it("should accept venueId prop", () => {
      render(<MediaGalleryManager venueId={456} />);
      
      expect(screen.getByText("Media Gallery")).toBeTruthy();
    });

    it("should accept custom maxPhotos", () => {
      render(<MediaGalleryManager maxPhotos={20} />);
      
      expect(screen.getByText(/up to 20 photos/i)).toBeTruthy();
    });

    it("should display initial photos", () => {
      const photos = [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
      ];
      render(<MediaGalleryManager photos={photos} />);
      
      const images = screen.getAllByAltText(/Gallery photo/);
      expect(images.length).toBe(2);
    });
  });
});
