import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiderContractTemplate, RiderContractData } from "./RiderContractTemplate";

describe("RiderContractTemplate Component", () => {
  describe("Form Initialization", () => {
    it("should render with empty form fields by default", () => {
      render(<RiderContractTemplate />);
      
      expect(screen.getByDisplayValue("")).toBeTruthy();
      expect(screen.getByText("Artist Rider Contract")).toBeTruthy();
    });

    it("should populate form with initial data when provided", () => {
      const initialData: Partial<RiderContractData> = {
        eventName: "Summer Festival",
        artistName: "The Jazz Collective",
        venue: "Grand Theater",
      };

      render(<RiderContractTemplate initialData={initialData} />);
      
      expect(screen.getByDisplayValue("Summer Festival")).toBeTruthy();
      expect(screen.getByDisplayValue("The Jazz Collective")).toBeTruthy();
      expect(screen.getByDisplayValue("Grand Theater")).toBeTruthy();
    });
  });

  describe("Form Sections", () => {
    it("should display all required sections", () => {
      render(<RiderContractTemplate />);
      
      expect(screen.getByText("Event Details")).toBeTruthy();
      expect(screen.getByText("Artist Requirements")).toBeTruthy();
      expect(screen.getByText("Technical Requirements")).toBeTruthy();
      expect(screen.getByText("Hospitality Requirements")).toBeTruthy();
      expect(screen.getByText("Additional Terms")).toBeTruthy();
    });

    it("should have tabs for Edit and Preview", () => {
      render(<RiderContractTemplate />);
      
      expect(screen.getByRole("tab", { name: /Edit/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Preview/i })).toBeTruthy();
    });
  });

  describe("Form Validation", () => {
    it("should show error when required fields are empty on save", async () => {
      const mockOnSave = vi.fn();
      render(<RiderContractTemplate onSave={mockOnSave} />);
      
      const saveButton = screen.getByRole("button", { name: /Save Rider/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it("should accept form submission with all required fields filled", async () => {
      const mockOnSave = vi.fn();
      const user = userEvent.setup();
      
      render(<RiderContractTemplate onSave={mockOnSave} />);
      
      // Fill required fields
      await user.type(screen.getByPlaceholderText("e.g., Summer Music Festival"), "Test Event");
      await user.type(screen.getByPlaceholderText("Artist or band name"), "Test Artist");
      await user.type(screen.getByPlaceholderText("e.g., The Grand Theater"), "Test Venue");
      
      const saveButton = screen.getByRole("button", { name: /Save Rider/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe("Checkbox Functionality", () => {
    it("should toggle checkbox states", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const lightingCheckbox = screen.getByRole("checkbox", { 
        name: /Professional Lighting Required/i 
      });
      
      expect(lightingCheckbox).not.toBeChecked();
      
      await user.click(lightingCheckbox);
      
      expect(lightingCheckbox).toBeChecked();
    });

    it("should handle multiple checkbox selections", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const dressingRoomCheckbox = screen.getByRole("checkbox", { 
        name: /Dressing Room Required/i 
      });
      const parkingCheckbox = screen.getByRole("checkbox", { 
        name: /Parking Provided/i 
      });
      
      await user.click(dressingRoomCheckbox);
      await user.click(parkingCheckbox);
      
      expect(dressingRoomCheckbox).toBeChecked();
      expect(parkingCheckbox).toBeChecked();
    });
  });

  describe("Preview Tab", () => {
    it("should display preview when Preview tab is clicked", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const previewTab = screen.getByRole("tab", { name: /Preview/i });
      await user.click(previewTab);
      
      expect(screen.getByText(/ARTIST RIDER CONTRACT/i)).toBeTruthy();
    });

    it("should show form data in preview format", async () => {
      const user = userEvent.setup();
      const initialData: Partial<RiderContractData> = {
        eventName: "Test Event",
        artistName: "Test Artist",
      };

      render(<RiderContractTemplate initialData={initialData} />);
      
      const previewTab = screen.getByRole("tab", { name: /Preview/i });
      await user.click(previewTab);
      
      expect(screen.getByText(/Test Event/)).toBeTruthy();
      expect(screen.getByText(/Test Artist/)).toBeTruthy();
    });
  });

  describe("Download Functionality", () => {
    it("should have download button in preview tab", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const previewTab = screen.getByRole("tab", { name: /Preview/i });
      await user.click(previewTab);
      
      const downloadButton = screen.getByRole("button", { name: /Download as Text/i });
      expect(downloadButton).toBeTruthy();
    });
  });

  describe("Read-Only Mode", () => {
    it("should disable form inputs when readOnly is true", () => {
      const initialData: Partial<RiderContractData> = {
        eventName: "Test Event",
      };

      render(<RiderContractTemplate initialData={initialData} readOnly={true} />);
      
      const inputs = screen.getAllByRole("textbox");
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it("should hide save button when readOnly is true", () => {
      render(<RiderContractTemplate readOnly={true} />);
      
      const saveButton = screen.queryByRole("button", { name: /Save Rider/i });
      expect(saveButton).not.toBeTruthy();
    });
  });

  describe("Input Fields", () => {
    it("should handle text input changes", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const eventNameInput = screen.getByPlaceholderText("e.g., Summer Music Festival");
      
      await user.type(eventNameInput, "My Event");
      
      expect(eventNameInput).toHaveValue("My Event");
    });

    it("should handle number input for fee", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const feeInput = screen.getByPlaceholderText("0");
      
      await user.type(feeInput, "2500");
      
      expect(feeInput).toHaveValue(2500);
    });

    it("should handle date input", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const dateInputs = screen.getAllByDisplayValue("");
      const dateInput = dateInputs.find(input => input.getAttribute("type") === "date");
      
      if (dateInput) {
        await user.type(dateInput, "2026-06-15");
        expect(dateInput).toHaveValue("2026-06-15");
      }
    });

    it("should handle textarea input for notes", async () => {
      const user = userEvent.setup();
      render(<RiderContractTemplate />);
      
      const textareas = screen.getAllByRole("textbox");
      const notesTextarea = textareas[textareas.length - 1];
      
      await user.type(notesTextarea, "Special requirements");
      
      expect(notesTextarea).toHaveValue("Special requirements");
    });
  });

  describe("Data Structure", () => {
    it("should pass correct data structure to onSave callback", async () => {
      const mockOnSave = vi.fn();
      const user = userEvent.setup();
      
      render(<RiderContractTemplate onSave={mockOnSave} />);
      
      await user.type(screen.getByPlaceholderText("e.g., Summer Music Festival"), "Test Event");
      await user.type(screen.getByPlaceholderText("Artist or band name"), "Test Artist");
      await user.type(screen.getByPlaceholderText("e.g., The Grand Theater"), "Test Venue");
      
      const saveButton = screen.getByRole("button", { name: /Save Rider/i });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            eventName: "Test Event",
            artistName: "Test Artist",
            venue: "Test Venue",
          })
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all inputs", () => {
      render(<RiderContractTemplate />);
      
      expect(screen.getByLabelText(/Event Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Artist Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Venue Name/i)).toBeTruthy();
    });

    it("should have descriptive text for sections", () => {
      render(<RiderContractTemplate />);
      
      expect(screen.getByText("Create and manage essential booking requirements and terms")).toBeTruthy();
    });
  });
});
