import { describe, it, expect } from "vitest";
import {
  ALL_TEMPLATES,
  SIMPLE_BOOKING_RIDER,
  validateRiderData,
  generateRiderHTML,
  getRiderTemplateById,
  type RiderContractTemplate,
  type RiderSection,
  type RiderField,
} from "./services/riderContractTemplate";

describe("Rider Contract Templates (Simplified)", () => {
  describe("ALL_TEMPLATES", () => {
    it("should contain the simple_booking template plus legacy aliases", () => {
      const keys = Object.keys(ALL_TEMPLATES);
      expect(keys).toContain("simple_booking");
      // Legacy aliases still resolve
      expect(keys).toContain("solo_artist");
      expect(keys).toContain("band");
      expect(keys).toContain("dj");
      expect(keys).toContain("speaker");
    });

    it("all legacy aliases should point to the same simple_booking template", () => {
      expect(ALL_TEMPLATES.solo_artist).toBe(SIMPLE_BOOKING_RIDER);
      expect(ALL_TEMPLATES.band).toBe(SIMPLE_BOOKING_RIDER);
      expect(ALL_TEMPLATES.dj).toBe(SIMPLE_BOOKING_RIDER);
      expect(ALL_TEMPLATES.speaker).toBe(SIMPLE_BOOKING_RIDER);
    });

    it("simple_booking template should have required top-level fields", () => {
      expect(SIMPLE_BOOKING_RIDER.id).toBe("simple_booking");
      expect(SIMPLE_BOOKING_RIDER.title).toBeTruthy();
      expect(SIMPLE_BOOKING_RIDER.description).toBeTruthy();
      expect(SIMPLE_BOOKING_RIDER.icon).toBeTruthy();
      expect(SIMPLE_BOOKING_RIDER.category).toBe("Universal");
      expect(Array.isArray(SIMPLE_BOOKING_RIDER.sections)).toBe(true);
      expect(SIMPLE_BOOKING_RIDER.sections.length).toBeGreaterThan(0);
    });
  });

  describe("SIMPLE_BOOKING_RIDER structure", () => {
    it("should have 5 sections", () => {
      expect(SIMPLE_BOOKING_RIDER.sections).toHaveLength(5);
    });

    it("should have expected section IDs", () => {
      const sectionIds = SIMPLE_BOOKING_RIDER.sections.map((s) => s.id);
      expect(sectionIds).toContain("booking_info");
      expect(sectionIds).toContain("payment");
      expect(sectionIds).toContain("technical");
      expect(sectionIds).toContain("hospitality");
      expect(sectionIds).toContain("terms");
    });

    it("each section should have fields with required properties", () => {
      for (const section of SIMPLE_BOOKING_RIDER.sections) {
        expect(section.id).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.icon).toBeTruthy();
        expect(Array.isArray(section.fields)).toBe(true);

        for (const field of section.fields) {
          expect(field.id).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(field.type).toBeTruthy();
          expect(
            ["text", "number", "textarea", "select", "date", "time", "checkbox"].includes(field.type)
          ).toBe(true);
        }
      }
    });

    it("booking_info section should have artist_name, event_name, event_date", () => {
      const bookingSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "booking_info");
      expect(bookingSection).toBeDefined();
      const fieldIds = bookingSection!.fields.map(f => f.id);
      expect(fieldIds).toContain("artist_name");
      expect(fieldIds).toContain("event_name");
      expect(fieldIds).toContain("event_date");
      expect(fieldIds).toContain("set_duration");
    });

    it("payment section should have performance_fee and deposit_required", () => {
      const paymentSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "payment");
      expect(paymentSection).toBeDefined();
      const fieldIds = paymentSection!.fields.map(f => f.id);
      expect(fieldIds).toContain("performance_fee");
      expect(fieldIds).toContain("deposit_required");
    });

    it("technical section should have sound_system and backline", () => {
      const techSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "technical");
      expect(techSection).toBeDefined();
      const fieldIds = techSection!.fields.map(f => f.id);
      expect(fieldIds).toContain("sound_system");
      expect(fieldIds).toContain("backline");
    });

    it("hospitality section should have green_room, meals_provided, parking", () => {
      const hospSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "hospitality");
      expect(hospSection).toBeDefined();
      const fieldIds = hospSection!.fields.map(f => f.id);
      expect(fieldIds).toContain("green_room");
      expect(fieldIds).toContain("meals_provided");
      expect(fieldIds).toContain("parking");
      expect(fieldIds).toContain("guest_list");
    });

    it("terms section should have cancellation_policy", () => {
      const termsSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "terms");
      expect(termsSection).toBeDefined();
      const fieldIds = termsSection!.fields.map(f => f.id);
      expect(fieldIds).toContain("cancellation_policy");
      expect(fieldIds).toContain("additional_notes");
    });
  });

  describe("getRiderTemplateById", () => {
    it("should return simple_booking template for valid IDs", () => {
      expect(getRiderTemplateById("simple_booking")).toBe(SIMPLE_BOOKING_RIDER);
      // Legacy aliases
      expect(getRiderTemplateById("solo_artist")).toBe(SIMPLE_BOOKING_RIDER);
      expect(getRiderTemplateById("band")).toBe(SIMPLE_BOOKING_RIDER);
      expect(getRiderTemplateById("dj")).toBe(SIMPLE_BOOKING_RIDER);
      expect(getRiderTemplateById("speaker")).toBe(SIMPLE_BOOKING_RIDER);
    });

    it("should return null for invalid ID", () => {
      expect(getRiderTemplateById("nonexistent")).toBeNull();
      expect(getRiderTemplateById("")).toBeNull();
    });
  });

  describe("validateRiderData", () => {
    it("should validate with all required fields present", () => {
      const data: Record<string, any> = {
        artist_name: "Test Artist",
        event_name: "Test Event",
        event_date: "2025-06-15",
        event_time: "20:00",
        venue_name: "Test Venue",
        set_duration: 60,
        performance_fee: 500,
      };
      const result = validateRiderData("simple_booking", data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation when required fields are missing", () => {
      const result = validateRiderData("simple_booking", {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return invalid for unknown template type", () => {
      const result = validateRiderData("unknown_type", {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should accept 0 as a valid value for number fields", () => {
      const data: Record<string, any> = {
        artist_name: "Test",
        event_name: "Test",
        event_date: "2025-06-15",
        event_time: "20:00",
        venue_name: "Venue",
        set_duration: 0,
        performance_fee: 0,
      };
      const result = validateRiderData("simple_booking", data);
      expect(result.valid).toBe(true);
    });
  });

  describe("generateRiderHTML", () => {
    it("should generate HTML string with artist name", () => {
      const data = {
        artist_name: "John Doe",
        performance_fee: 500,
        event_name: "Friday Night Live",
        event_date: "2025-07-01",
      };
      const html = generateRiderHTML("simple_booking", data);
      expect(html).toContain("John Doe");
      expect(html).toContain("500");
      expect(html).toContain("Friday Night Live");
      expect(html).toContain("<div");
    });

    it("should work with legacy template IDs", () => {
      const data = { artist_name: "The Rockers" };
      const html = generateRiderHTML("band", data);
      expect(html).toContain("The Rockers");
      expect(html).toContain("<div");
    });

    it("should handle empty data gracefully", () => {
      const html = generateRiderHTML("simple_booking", {});
      expect(html).toContain("<div");
      expect(html).toContain("Booking Rider");
    });

    it("should return error message for unknown template type", () => {
      const html = generateRiderHTML("nonexistent", { test: "value" });
      expect(html).toContain("Template not found");
    });

    it("should render boolean fields as checkmarks", () => {
      const data = {
        artist_name: "Test",
        green_room: true,
        meals_provided: false,
      };
      const html = generateRiderHTML("simple_booking", data);
      expect(html).toContain("✓ Yes");
      expect(html).toContain("✗ No");
    });
  });

  describe("Default values", () => {
    it("should have sensible default values for key fields", () => {
      const techSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "technical");
      expect(techSection).toBeDefined();
      const soundField = techSection!.fields.find(f => f.id === "sound_system");
      expect(soundField?.defaultValue).toBe("Venue provides");

      const bookingSection = SIMPLE_BOOKING_RIDER.sections.find(s => s.id === "booking_info");
      const durationField = bookingSection!.fields.find(f => f.id === "set_duration");
      expect(durationField?.defaultValue).toBe(60);
    });

    it("all select fields should have options defined", () => {
      for (const section of SIMPLE_BOOKING_RIDER.sections) {
        for (const field of section.fields) {
          if (field.type === "select") {
            expect(field.options).toBeDefined();
            expect(field.options!.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it("required fields should match the requiredFields array", () => {
      const allRequired: string[] = [];
      for (const section of SIMPLE_BOOKING_RIDER.sections) {
        for (const field of section.fields) {
          if (field.required) allRequired.push(field.id);
        }
      }
      expect(allRequired.sort()).toEqual(SIMPLE_BOOKING_RIDER.requiredFields.sort());
    });
  });
});
