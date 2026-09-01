import { sql } from 'drizzle-orm';

type SandboxPostSchemaDb = {
  execute: (...args: any[]) => Promise<any>;
};

let schemaReadyPromise: Promise<void> | null = null;

export function ensureSandboxPostSchema(db: SandboxPostSchemaDb): Promise<void> {
  if (schemaReadyPromise) return schemaReadyPromise;
  schemaReadyPromise = db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`sandbox_posts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`artistProfileId\` int NOT NULL,
      \`artistUserId\` int NOT NULL,
      \`content\` text NOT NULL,
      \`mediaType\` enum('image','video'),
      \`mediaUrl\` text,
      \`mediaKey\` text,
      \`mediaMimeType\` varchar(100),
      \`mediaFileName\` varchar(255),
      \`mediaSizeBytes\` int,
      \`mediaDurationSeconds\` int,
      \`mediaThumbnailUrl\` text,
      \`mediaThumbnailKey\` text,
      \`status\` enum('active','hidden') NOT NULL DEFAULT 'active',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_sandbox_posts_profile\` (\`artistProfileId\`),
      UNIQUE KEY \`uniq_sandbox_posts_owner\` (\`artistUserId\`),
      KEY \`idx_sandbox_posts_public\` (\`artistProfileId\`, \`status\`)
    )
  `)).then(() => undefined).catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });
  return schemaReadyPromise;
}

export function resetSandboxPostSchemaForTests() {
  schemaReadyPromise = null;
}
