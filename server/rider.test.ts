import { describe, it, expect } from "vitest";
import {
  ALL_TEMPLATES,
  SOLO_ARTIST_RIDER,
  BAND_RIDER,
  DJ_RIDER,
  SPEAKER_RIDER,
  validateRiderData,
  generateRiderHTML,
  getRiderTemplateById,
  type RiderContractTemplate,
  type RiderSection,
  type RiderField,
} from "./services/riderContractTemplate";

describe("Rider Contract Templates", () => {
  describe("ALL_TEMPLATES", () => {
    it("should contain exactly 4 template types", () => {
      const keys = Object.keys(ALL_TEMPLATES);
      expect(keys).toHaveLength(4);
      expect(keys).toContain("solo_artist");
      expect(keys).toContain("band");
      expect(keys).toContain("dj");
      expect(keys).toContain("speaker");
    });

    it("each template should have required top-level fields", () => {
      for (const [key, template] of Object.entries(ALL_TEMPLATES)) {
        expect(template.id).toBe(key);
        expect(template.title).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.icon).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(Array.isArray(template.sections)).toBe(true);
        expect(template.sections.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SOLO_ARTIST_RIDER", () => {
    it("should have 8 sections", () => {
      expect(SOLO_ARTIST_RIDER.sections).toHaveLength(8);
    });

    it("should have expected section IDs", () => {
      const sectionIds = SOLO_ARTIST_RIDER.sections.map((s) => s.id);
      expect(sectionIds).toContain("event_details");
      expect(sectionIds).toContain("artist_info");
      expect(sectionIds).toContain("technical_requirements");
      expect(sectionIds).toContain("stage_setup");
      expect(sectionIds).toContain("hospitality");
      expect(sectionIds).toContain("payment_terms");
      expect(sectionIds).toContain("additional_terms");
      expect(sectionIds).toContain("contact_info");
    });

    it("each section should have fields with required properties", () => {
      for (const section of SOLO_ARTIST_RIDER.sections) {
        expect(section.id).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.icon).toBeTruthy();
        expect(Array.isArray(section.fields)).toBe(true);

        for (const field of section.fields) {
          expect(field.id).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(field.type).toBeTruthy();
          expect(
            ["text", "number", "textarea", "select", "date", "time", "checkbox", "email", "tel"].includes(field.type)
          ).toBe(true);
        }
      }
    });

    it("technical section should have sound_system and monitor fields", () => {
      const techSection = SOLO_ARTIST_RIDER.sections.find(
        (s) => s.id === "technical_requirements"
      );
      expect(techSection).toBeDefined();
      const fieldIds = techSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("sound_system");
      expect(fieldIds).toContain("monitors");
      expect(fieldIds).toContain("microphones");
    });

    it("payment section should have performance_fee and cancellation_policy", () => {
      const paymentSection = SOLO_ARTIST_RIDER.sections.find(
        (s) => s.id === "payment_terms"
      );
      expect(paymentSection).toBeDefined();
      const fieldIds = paymentSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("performance_fee");
      expect(fieldIds).toContain("cancellation_policy");
    });

    it("hospitality section should have meals and beverages fields", () => {
      const hospSection = SOLO_ARTIST_RIDER.sections.find(
        (s) => s.id === "hospitality"
      );
      expect(hospSection).toBeDefined();
      const fieldIds = hospSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("meals");
      expect(fieldIds).toContain("beverages");
    });
  });

  describe("BAND_RIDER", () => {
    it("should have 8 sections", () => {
      expect(BAND_RIDER.sections).toHaveLength(8);
    });

    it("should have band-specific fields like band_members", () => {
      const artistSection = BAND_RIDER.sections.find(
        (s) => s.id === "band_info"
      );
      expect(artistSection).toBeDefined();
      const fieldIds = artistSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("band_members");
    });

    it("technical section should have backline fields", () => {
      const stageSection = BAND_RIDER.sections.find(
        (s) => s.id === "stage_setup"
      );
      expect(stageSection).toBeDefined();
      const fieldIds = stageSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("backline_provided");
    });
  });

  describe("DJ_RIDER", () => {
    it("should have 8 sections", () => {
      expect(DJ_RIDER.sections).toHaveLength(8);
    });

    it("should have DJ-specific fields like dj_equipment", () => {
      const techSection = DJ_RIDER.sections.find(
        (s) => s.id === "technical_requirements"
      );
      expect(techSection).toBeDefined();
      const fieldIds = techSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("dj_equipment");
    });
  });

  describe("SPEAKER_RIDER", () => {
    it("should have 8 sections", () => {
      expect(SPEAKER_RIDER.sections).toHaveLength(8);
    });

    it("should have speaker-specific fields like topic", () => {
      const artistSection = SPEAKER_RIDER.sections.find(
        (s) => s.id === "speaker_info"
      );
      expect(artistSection).toBeDefined();
      const fieldIds = artistSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("topic");
    });

    it("technical section should have presentation_display field", () => {
      const techSection = SPEAKER_RIDER.sections.find(
        (s) => s.id === "technical_requirements"
      );
      expect(techSection).toBeDefined();
      const fieldIds = techSection!.fields.map((f) => f.id);
      expect(fieldIds).toContain("presentation_display");
    });
  });

  describe("getRiderTemplateById", () => {
    it("should return correct template for valid IDs", () => {
      expect(getRiderTemplateById("solo_artist")).toBe(SOLO_ARTIST_RIDER);
      expect(getRiderTemplateById("band")).toBe(BAND_RIDER);
      expect(getRiderTemplateById("dj")).toBe(DJ_RIDER);
      expect(getRiderTemplateById("speaker")).toBe(SPEAKER_RIDER);
    });

    it("should return null for invalid ID", () => {
      expect(getRiderTemplateById("nonexistent")).toBeNull();
      expect(getRiderTemplateById("")).toBeNull();
    });
  });

  describe("validateRiderData", () => {
    it("should validate with all required fields present", () => {
      const requiredFields: Record<string, any> = {};
      for (const section of SOLO_ARTIST_RIDER.sections) {
        for (const field of section.fields) {
          if (field.required) {
            requiredFields[field.id] =
              field.type === "number" ? 100 : "test value";
          }
        }
      }
      const result = validateRiderData("solo_artist", requiredFields);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation when required fields are missing", () => {
      const result = validateRiderData("solo_artist", {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return invalid for unknown template type", () => {
      const result = validateRiderData("unknown_type", {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("generateRiderHTML", () => {
    it("should generate HTML string for solo_artist template", () => {
      const data = {
        artist_name: "John Doe",
        performance_fee: 5000,
        performance_duration: "60 minutes",
      };
      const html = generateRiderHTML("solo_artist", data);
      expect(html).toContain("John Doe");
      expect(html).toContain("5000");
      expect(html).toContain("60 minutes");
      // HTML is a div-based template, not a full HTML document
      expect(html).toContain("<div");
    });

    it("should generate HTML for band template", () => {
      const data = {
        artist_name: "The Rockers",
        band_members: "4",
      };
      const html = generateRiderHTML("band", data);
      expect(html).toContain("The Rockers");
      expect(html).toContain("<div");
    });

    it("should handle empty data gracefully", () => {
      const html = generateRiderHTML("solo_artist", {});
      expect(html).toContain("<div");
      expect(html).toContain("Solo Artist Rider");
    });

    it("should return error message for unknown template type", () => {
      const html = generateRiderHTML("nonexistent", { test: "value" });
      expect(html).toContain("Template not found");
    });
  });

  describe("Default values", () => {
    it("solo_artist should have sensible default values for key fields", () => {
      const techSection = SOLO_ARTIST_RIDER.sections.find(
        (s) => s.id === "technical_requirements"
      );
      expect(techSection).toBeDefined();
      const paField = techSection!.fields.find((f) => f.id === "sound_system");
      expect(paField?.defaultValue).toBeTruthy();

      const paymentSection = SOLO_ARTIST_RIDER.sections.find(
        (s) => s.id === "payment_terms"
      );
      expect(paymentSection).toBeDefined();
      const feeField = paymentSection!.fields.find(
        (f) => f.id === "performance_fee"
      );
      // performance_fee has no defaultValue, but has a placeholder
      expect(feeField).toBeDefined();
      expect(feeField!.placeholder).toBeTruthy();
    });

    it("all select fields should have options defined", () => {
      for (const template of Object.values(ALL_TEMPLATES)) {
        for (const section of template.sections) {
          for (const field of section.fields) {
            if (field.type === "select") {
              expect(field.options).toBeDefined();
              expect(field.options!.length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });
});
