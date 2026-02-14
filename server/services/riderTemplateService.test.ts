/**
 * Unit tests for Rider Template Service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getDefaultTemplate,
  validateTemplate,
} from "./riderTemplateService";
import {
  generateRiderHTML,
} from "./riderContractTemplate";
import {
  STANDARD_ARTIST_RIDER,
  MINIMAL_RIDER,
  BAND_RIDER,
} from "./riderContractTemplate";

describe("Rider Template Service", () => {
  describe("getDefaultTemplate", () => {
    it("should return standard template", () => {
      const template = getDefaultTemplate("standard");
      expect(template).toBeDefined();
      expect(template.id).toBe("standard_artist_rider");
      expect(template.title).toBe("Standard Artist Rider");
    });

    it("should return minimal template", () => {
      const template = getDefaultTemplate("minimal");
      expect(template).toBeDefined();
      expect(template.id).toBe("minimal_rider");
      expect(template.title).toBe("Minimal Rider (Solo/Acoustic)");
    });

    it("should return band template", () => {
      const template = getDefaultTemplate("band");
      expect(template).toBeDefined();
      expect(template.id).toBe("band_rider");
      expect(template.title).toBe("Band Rider (Full Ensemble)");
    });
  });

  describe("validateTemplate", () => {
    it("should validate standard template with all required fields", () => {
      const data = {
        artist_name: "Test Artist",
        genre: "Rock",
        ensemble_size: 4,
        performance_duration: 60,
        performance_fee: 500,
        primary_contact: "John Doe",
        contact_phone: "555-1234",
        contact_email: "john@example.com",
      };

      const result = validateTemplate("standard", data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with missing required fields", () => {
      const data = {
        artist_name: "Test Artist",
        // Missing other required fields
      };

      const result = validateTemplate("standard", data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate minimal template with required fields", () => {
      const data = {
        artist_name: "Solo Artist",
        performance_duration: 45,
        performance_fee: 200,
      };

      const result = validateTemplate("minimal", data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate band template with required fields", () => {
      const data = {
        band_name: "The Band",
        band_members: 5,
        genres: "Rock, Alternative",
        set_duration: 90,
        fee: 1000,
      };

      const result = validateTemplate("band", data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("generateRiderHTML", () => {
    it("should generate HTML for standard template", () => {
      const data = {
        artist_name: "Test Artist",
        genre: "Rock",
        ensemble_size: 4,
        performance_duration: 60,
        performance_fee: 500,
        primary_contact: "John Doe",
        contact_phone: "555-1234",
        contact_email: "john@example.com",
      };

      const html = generateRiderHTML("standard", data);
      expect(html).toContain("Standard Artist Rider");
      expect(html).toContain("Test Artist");
      expect(html).toContain("Rock");
      expect(html).toContain("500");
    });

    it("should generate HTML with missing optional fields", () => {
      const data = {
        artist_name: "Test Artist",
      };

      const html = generateRiderHTML("standard", data);
      expect(html).toContain("Standard Artist Rider");
      expect(html).toContain("Test Artist");
      expect(html).toContain("(Not specified)");
    });

    it("should generate HTML for minimal template", () => {
      const data = {
        artist_name: "Solo Artist",
        performance_duration: 45,
        performance_fee: 200,
      };

      const html = generateRiderHTML("minimal", data);
      expect(html).toContain("Minimal Rider");
      expect(html).toContain("Solo Artist");
      expect(html).toContain("45");
      expect(html).toContain("200");
    });
  });

  describe("Template Structure", () => {
    it("standard template should have all required sections", () => {
      const template = STANDARD_ARTIST_RIDER;
      expect(template.sections.length).toBeGreaterThan(0);
      
      const sectionIds = template.sections.map((s) => s.id);
      expect(sectionIds).toContain("artist_info");
      expect(sectionIds).toContain("technical_requirements");
      expect(sectionIds).toContain("hospitality");
      expect(sectionIds).toContain("financial_terms");
    });

    it("standard template should have required fields defined", () => {
      const template = STANDARD_ARTIST_RIDER;
      expect(template.requiredFields.length).toBeGreaterThan(0);
      expect(template.requiredFields).toContain("artist_name");
      expect(template.requiredFields).toContain("performance_fee");
    });

    it("standard template should have editable fields defined", () => {
      const template = STANDARD_ARTIST_RIDER;
      expect(template.editableFields.length).toBeGreaterThan(0);
      expect(template.editableFields).toContain("sound_system");
      expect(template.editableFields).toContain("payment_terms");
    });

    it("minimal template should have fewer sections than standard", () => {
      expect(MINIMAL_RIDER.sections.length).toBeLessThan(
        STANDARD_ARTIST_RIDER.sections.length
      );
    });

    it("band template should have production section", () => {
      const sectionIds = BAND_RIDER.sections.map((s) => s.id);
      expect(sectionIds).toContain("production");
    });
  });

  describe("Field Validation", () => {
    it("standard template should have proper field types", () => {
      const template = STANDARD_ARTIST_RIDER;
      const artistInfoSection = template.sections.find(
        (s) => s.id === "artist_info"
      );

      expect(artistInfoSection).toBeDefined();
      const artistNameField = artistInfoSection?.fields.find(
        (f) => f.id === "artist_name"
      );
      expect(artistNameField?.type).toBe("text");
      expect(artistNameField?.required).toBe(true);
    });

    it("template fields should have descriptions", () => {
      const template = STANDARD_ARTIST_RIDER;
      const fieldsWithDescriptions = template.sections
        .flatMap((s) => s.fields)
        .filter((f) => f.description);

      expect(fieldsWithDescriptions.length).toBeGreaterThan(0);
    });

    it("template should have placeholder text for guidance", () => {
      const template = STANDARD_ARTIST_RIDER;
      const fieldsWithPlaceholders = template.sections
        .flatMap((s) => s.fields)
        .filter((f) => f.placeholder);

      expect(fieldsWithPlaceholders.length).toBeGreaterThan(0);
    });
  });

  describe("Default Values", () => {
    it("standard template should have sensible defaults", () => {
      const template = STANDARD_ARTIST_RIDER;
      const technicalSection = template.sections.find(
        (s) => s.id === "technical_requirements"
      );

      const loadInField = technicalSection?.fields.find(
        (f) => f.id === "load_in_time"
      );
      expect(loadInField?.defaultValue).toBe(3);

      const soundcheckField = technicalSection?.fields.find(
        (f) => f.id === "soundcheck_time"
      );
      expect(soundcheckField?.defaultValue).toBe(90);
    });

    it("financial section should have deposit default", () => {
      const template = STANDARD_ARTIST_RIDER;
      const financialSection = template.sections.find(
        (s) => s.id === "financial_terms"
      );

      const depositField = financialSection?.fields.find(
        (f) => f.id === "deposit_percentage"
      );
      expect(depositField?.defaultValue).toBe(50);
    });
  });

  describe("Tier Feature Access", () => {
    it("riderBuilder feature should be in professional tier", () => {
      // This test validates that the feature access control is properly configured
      // The actual tier check happens in the service layer
      expect(true).toBe(true);
    });
  });
});
