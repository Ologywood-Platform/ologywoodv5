/**
 * Rider Template Service
 * Manages artist rider templates and operations
 */

import { getDb } from "../db";
import { riderTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  STANDARD_ARTIST_RIDER,
  MINIMAL_RIDER,
  BAND_RIDER,
  validateRiderData,
  generateRiderHTML,
  type RiderContractTemplate,
} from "./riderContractTemplate";

/**
 * Get all rider templates for an artist
 */
export async function getArtistRiderTemplates(artistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(riderTemplates)
    .where(eq(riderTemplates.artistId, artistId));
}

/**
 * Get a specific rider template
 */
export async function getRiderTemplate(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(riderTemplates)
    .where(eq(riderTemplates.id, templateId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new rider template
 */
export async function createRiderTemplate(
  artistId: number,
  templateName: string,
  templateData: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(riderTemplates).values({
    artistId,
    templateName,
    templateData,
  });

  return {
    id: (result as any).insertId,
    artistId,
    templateName,
    templateData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update an existing rider template
 */
export async function updateRiderTemplate(
  templateId: number,
  artistId: number,
  templateName?: string,
  templateData?: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getRiderTemplate(templateId);
  if (!existing || existing.artistId !== artistId) {
    throw new Error("Rider template not found or unauthorized");
  }

  const updateData: any = {};
  if (templateName) updateData.templateName = templateName;
  if (templateData) updateData.templateData = templateData;
  updateData.updatedAt = new Date();

  await db
    .update(riderTemplates)
    .set(updateData)
    .where(eq(riderTemplates.id, templateId));

  return {
    ...existing,
    ...updateData,
  };
}

/**
 * Delete a rider template
 */
export async function deleteRiderTemplate(templateId: number, artistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getRiderTemplate(templateId);
  if (!existing || existing.artistId !== artistId) {
    throw new Error("Rider template not found or unauthorized");
  }

  await db.delete(riderTemplates).where(eq(riderTemplates.id, templateId));
  return true;
}

/**
 * Get default template by type
 */
export function getDefaultTemplate(
  templateType: "standard" | "minimal" | "band"
): RiderContractTemplate {
  const templates = {
    standard: STANDARD_ARTIST_RIDER,
    minimal: MINIMAL_RIDER,
    band: BAND_RIDER,
  };
  return templates[templateType];
}

/**
 * Create a new template from a default template
 */
export async function createFromDefaultTemplate(
  artistId: number,
  templateType: "standard" | "minimal" | "band",
  customName?: string
) {
  const defaultTemplate = getDefaultTemplate(templateType);
  const templateData = {
    baseTemplate: templateType,
    sections: defaultTemplate.sections,
    editableFields: defaultTemplate.editableFields,
    requiredFields: defaultTemplate.requiredFields,
  };

  const templateName = customName || `${defaultTemplate.title} - ${new Date().toLocaleDateString()}`;

  return await createRiderTemplate(artistId, templateName, templateData);
}

/**
 * Validate rider template data
 */
export function validateTemplate(
  templateType: "standard" | "minimal" | "band",
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const template = getDefaultTemplate(templateType);
  const errors: string[] = [];

  // Check required fields
  for (const fieldId of template.requiredFields) {
    if (!data[fieldId]) {
      errors.push(`Required field missing: ${fieldId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate HTML preview for a rider template
 */
export async function generateRiderPreview(
  templateId: number,
  artistId: number
): Promise<string> {
  const template = await getRiderTemplate(templateId);
  if (!template || template.artistId !== artistId) {
    throw new Error("Rider template not found or unauthorized");
  }

  const baseTemplate = template.templateData?.baseTemplate || "standard";
  const defaultTemplate = getDefaultTemplate(
    baseTemplate as "standard" | "minimal" | "band"
  );

  return generateRiderHTML(defaultTemplate.id, template.templateData || {});
}

/**
 * Export rider template as JSON
 */
export async function exportRiderAsJSON(
  templateId: number,
  artistId: number
): Promise<string> {
  const template = await getRiderTemplate(templateId);
  if (!template || template.artistId !== artistId) {
    throw new Error("Rider template not found or unauthorized");
  }

  return JSON.stringify(
    {
      templateName: template.templateName,
      templateData: template.templateData,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

/**
 * Duplicate a rider template
 */
export async function duplicateRiderTemplate(
  templateId: number,
  artistId: number,
  newName?: string
) {
  const template = await getRiderTemplate(templateId);
  if (!template || template.artistId !== artistId) {
    throw new Error("Rider template not found or unauthorized");
  }

  const duplicateName =
    newName || `${template.templateName} (Copy)`;

  return await createRiderTemplate(
    artistId,
    duplicateName,
    JSON.parse(JSON.stringify(template.templateData))
  );
}

/**
 * Get rider template statistics
 */
export async function getRiderTemplateStats(artistId: number) {
  const templates = await getArtistRiderTemplates(artistId);

  const stats = {
    totalTemplates: templates.length,
    templatesByType: {
      standard: 0,
      minimal: 0,
      band: 0,
    },
    lastUpdated: null as Date | null,
  };

  for (const template of templates) {
    const baseType = template.templateData?.baseTemplate || "standard";
    if (baseType in stats.templatesByType) {
      stats.templatesByType[baseType as keyof typeof stats.templatesByType]++;
    }

    if (template.updatedAt && (!stats.lastUpdated || template.updatedAt > stats.lastUpdated)) {
      stats.lastUpdated = template.updatedAt;
    }
  }

  return stats;
}
