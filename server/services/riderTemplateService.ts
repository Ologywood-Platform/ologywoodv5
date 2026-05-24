/**
 * Rider Template Service
 * Manages artist rider templates and CRUD operations
 */

import { getDb } from "../db";
import { riderTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  ALL_TEMPLATES,
  SIMPLE_BOOKING_RIDER,
  validateRiderData,
  generateRiderHTML,
  getRiderTemplateById as getDefaultTemplateById,
  type RiderContractTemplate,
} from "./riderContractTemplate";

// Re-export types
export type { RiderContractTemplate };

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
 * Get a specific rider template by ID
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
  templateData: Record<string, any>,
  templateType: string = "custom"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(riderTemplates).values({
    artistId,
    templateName,
    templateData,
    templateType,
    isDefault: false,
  });

  return {
    id: (result as any).insertId,
    artistId,
    templateName,
    templateData,
    templateType,
    isDefault: false,
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
 * Get default template by type key
 */
export function getDefaultTemplate(
  templateType: string
): RiderContractTemplate | null {
  return getDefaultTemplateById(templateType);
}

/**
 * List all available default template types
 */
export function listDefaultTemplates() {
  return Object.entries(ALL_TEMPLATES).map(([key, template]) => ({
    id: key,
    title: template.title,
    description: template.description,
    icon: template.icon,
    category: template.category,
    sectionCount: template.sections.length,
    fieldCount: template.sections.reduce((sum, s) => sum + s.fields.length, 0),
  }));
}

/**
 * Create a new template from a default template
 */
export async function createFromDefaultTemplate(
  artistId: number,
  templateType: string,
  customName?: string
) {
  const defaultTemplate = getDefaultTemplate(templateType);
  if (!defaultTemplate) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  // Build initial data from default values
  const initialData: Record<string, any> = {};
  for (const section of defaultTemplate.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined) {
        initialData[field.id] = field.defaultValue;
      }
    }
  }

  const templateData = {
    baseTemplate: templateType,
    formData: initialData,
  };

  const templateName = customName || `${defaultTemplate.title} - ${new Date().toLocaleDateString()}`;

  return await createRiderTemplate(artistId, templateName, templateData, templateType);
}

/**
 * Validate rider template data
 */
export function validateTemplate(
  templateType: string,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  return validateRiderData(templateType, data);
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

  const baseTemplate = template.templateType || template.templateData?.baseTemplate || "solo_artist";
  return generateRiderHTML(baseTemplate, template.templateData?.formData || template.templateData || {});
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
      templateType: template.templateType,
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

  const duplicateName = newName || `${template.templateName} (Copy)`;

  return await createRiderTemplate(
    artistId,
    duplicateName,
    JSON.parse(JSON.stringify(template.templateData)),
    template.templateType || "custom"
  );
}

/**
 * Set a rider template as the default for auto-attach to new bookings.
 * Pass null to clear the default.
 */
export async function setDefaultRiderTemplate(
  templateId: number | null,
  artistId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Clear any existing default for this artist
  const existing = await getArtistRiderTemplates(artistId);
  for (const t of existing) {
    if (t.isDefault) {
      await db
        .update(riderTemplates)
        .set({ isDefault: false })
        .where(eq(riderTemplates.id, t.id));
    }
  }

  // Set the new default
  if (templateId !== null) {
    const template = await getRiderTemplate(templateId);
    if (!template || template.artistId !== artistId) {
      throw new Error("Rider template not found or unauthorized");
    }
    await db
      .update(riderTemplates)
      .set({ isDefault: true })
      .where(eq(riderTemplates.id, templateId));
  }

  return { success: true };
}

/**
 * Get the artist's default rider template (the one marked isDefault)
 */
export async function getDefaultRiderForArtist(artistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(riderTemplates)
    .where(and(eq(riderTemplates.artistId, artistId), eq(riderTemplates.isDefault, true)))
    .limit(1);

  return result[0] || null;
}

/**
 * Get rider template statistics
 */
export async function getRiderTemplateStats(artistId: number) {
  const templates = await getArtistRiderTemplates(artistId);

  const stats = {
    totalTemplates: templates.length,
    templatesByType: {} as Record<string, number>,
    lastUpdated: null as Date | null,
  };

  for (const template of templates) {
    const type = template.templateType || "custom";
    stats.templatesByType[type] = (stats.templatesByType[type] || 0) + 1;

    if (template.updatedAt && (!stats.lastUpdated || template.updatedAt > stats.lastUpdated)) {
      stats.lastUpdated = template.updatedAt;
    }
  }

  return stats;
}
