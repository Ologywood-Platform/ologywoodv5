type VideoPortfolioSchemaDb = {
  execute: (query: string, values?: unknown[]) => Promise<any>;
};

let schemaReadyPromise: Promise<void> | null = null;

function rowsFromResult(result: unknown): any[] {
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] as any[] : [];
}

/**
 * Aligns legacy video_portfolio tables with the current schema without deleting
 * or replacing existing clips. Older environments used `url` and had no
 * lifecycle status, while the current API uses `videoUrl` and soft removal.
 */
export function ensureVideoPortfolioSchema(db: VideoPortfolioSchemaDb): Promise<void> {
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    const columnResult = await db.execute('SHOW COLUMNS FROM video_portfolio');
    const columns = new Map(
      rowsFromResult(columnResult).map((row) => [String(row.Field ?? row.field), row]),
    );

    if (!columns.has('videoUrl') && columns.has('url')) {
      await db.execute('ALTER TABLE `video_portfolio` CHANGE COLUMN `url` `videoUrl` text NOT NULL');
      columns.delete('url');
      columns.set('videoUrl', { Field: 'videoUrl' });
    } else if (!columns.has('videoUrl')) {
      await db.execute('ALTER TABLE `video_portfolio` ADD COLUMN `videoUrl` text NULL');
      columns.set('videoUrl', { Field: 'videoUrl' });
    } else if (columns.has('url')) {
      await db.execute("UPDATE `video_portfolio` SET `videoUrl` = `url` WHERE (`videoUrl` IS NULL OR `videoUrl` = '') AND `url` IS NOT NULL");
    }

    if (!columns.has('status')) {
      await db.execute("ALTER TABLE `video_portfolio` ADD COLUMN `status` enum('active','processing','removed') NOT NULL DEFAULT 'active'");
    }
  })().catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });

  return schemaReadyPromise;
}

export function resetVideoPortfolioSchemaCheckForTests() {
  schemaReadyPromise = null;
}
