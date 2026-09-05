import { sql } from 'drizzle-orm';

type ArtistReleaseSchemaDb = {
  execute: (...args: any[]) => Promise<any>;
};

let disclosureSchemaReadyPromise: Promise<void> | null = null;

const DISCLOSURE_COLUMNS = [
  '`aiUseDisclosureEnabled` boolean DEFAULT false NOT NULL',
  '`aiUseLevel` varchar(40)',
  '`aiUseComponents` json',
  '`aiUseTools` varchar(300)',
  '`aiUseNotes` varchar(1000)',
] as const;

/**
 * The release purchase and delivery paths must remain compatible with older
 * runtime databases that predate optional AI disclosure metadata. Repair only
 * those already-defined additive columns, once per process, and never touch
 * release or purchase rows.
 */
export function ensureArtistReleaseDisclosureSchema(db: ArtistReleaseSchemaDb): Promise<void> {
  if (disclosureSchemaReadyPromise) return disclosureSchemaReadyPromise;

  disclosureSchemaReadyPromise = (async () => {
    for (const column of DISCLOSURE_COLUMNS) {
      await db.execute(sql.raw(
        `ALTER TABLE \`artist_releases\` ADD COLUMN IF NOT EXISTS ${column}`,
      ));
    }
  })().catch((error) => {
    disclosureSchemaReadyPromise = null;
    throw error;
  });

  return disclosureSchemaReadyPromise;
}

export function resetArtistReleaseDisclosureSchemaForTests() {
  disclosureSchemaReadyPromise = null;
}
