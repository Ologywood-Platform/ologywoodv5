import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { ensureContentReleaseSchema, resetContentReleaseSchemaForTests } from './services/contentReleaseSchemaService';

const dialect = new MySqlDialect();
const names = ['aiUseDisclosureEnabled', 'aiUseLevel', 'aiUseComponents', 'aiUseTools', 'aiUseNotes'];
const queryText = (query: any) => typeof query === 'string' ? query : dialect.sqlToQuery(query).sql;
function mockDatabase(columns: string[] = names) {
  const commands: string[] = [];
  return { commands, execute: vi.fn(async (query: any) => {
    const text = queryText(query);
    commands.push(text);
    return text.startsWith('SHOW COLUMNS') ? [columns.map(Field => ({ Field })), []] : [{}, []];
  }) };
}

describe('Content Release runtime schema compatibility', () => {
  beforeEach(resetContentReleaseSchemaForTests);

  it('creates both absent tables with the declared columns and indexes, without row writes', async () => {
    const db = mockDatabase();
    await ensureContentReleaseSchema(db);
    expect(db.commands).toHaveLength(3);
    expect(db.commands[0]).toContain('CREATE TABLE IF NOT EXISTS `releases`');
    expect(db.commands[1]).toContain('CREATE TABLE IF NOT EXISTS `content_release_purchases`');
    for (const name of names) expect(db.commands[0]).toContain('`' + name + '`');
    expect(db.commands[1]).toContain('UNIQUE KEY `uniq_content_release_purchase` (`releaseId`, `userId`)');
    expect(db.commands.join('\n')).not.toMatch(/\b(?:INSERT INTO|DELETE FROM|UPDATE `|DROP TABLE|TRUNCATE|REPLACE INTO)\b/);
  });

  it('repairs only missing optional AI columns on an older table', async () => {
    const db = mockDatabase(['aiUseLevel', 'aiUseTools']);
    await ensureContentReleaseSchema(db);
    const alters = db.commands.filter(c => c.startsWith('ALTER'));
    expect(alters).toHaveLength(3);
    expect(alters.join('\n')).toContain('`aiUseDisclosureEnabled`');
    expect(alters.join('\n')).toContain('`aiUseComponents`');
    expect(alters.join('\n')).toContain('`aiUseNotes`');
    expect(alters.join('\n')).not.toContain('ADD COLUMN IF NOT EXISTS');
  });

  it('deduplicates concurrent checks and keeps readiness isolated by database object', async () => {
    const db = mockDatabase();
    await Promise.all([ensureContentReleaseSchema(db), ensureContentReleaseSchema(db)]);
    await ensureContentReleaseSchema(db);
    expect(db.commands).toHaveLength(3);
    const other = mockDatabase();
    await ensureContentReleaseSchema(other);
    expect(other.commands).toHaveLength(3);
  });

  it('retries after a failure and does not mark incomplete repairs ready', async () => {
    const db = mockDatabase();
    db.execute.mockRejectedValueOnce(new Error('temporary schema failure'));
    await expect(ensureContentReleaseSchema(db)).rejects.toThrow('temporary schema failure');
    await expect(ensureContentReleaseSchema(db)).resolves.toBeUndefined();
    expect(db.commands).toHaveLength(3);
  });

  it('tolerates only a duplicate-column race, not a permission failure', async () => {
    const db = mockDatabase([]);
    const execute = db.execute;
    const raced = { execute: vi.fn(async (q: any) => {
      if (queryText(q).startsWith('ALTER')) throw Object.assign(new Error('duplicate'), {code:'ER_DUP_FIELDNAME'});
      return execute(q);
    }) };
    await expect(ensureContentReleaseSchema(raced)).resolves.toBeUndefined();
    const denied = { execute: vi.fn(async (q: any) => {
      if (queryText(q).startsWith('ALTER')) throw Object.assign(new Error('denied'), {code:'ER_TABLEACCESS_DENIED_ERROR'});
      return execute(q);
    }) };
    await expect(ensureContentReleaseSchema(denied)).rejects.toThrow('denied');
  });

  it('rejects an invalid column-inspection response rather than blindly adding fields', async () => {
    const db = { execute: vi.fn().mockResolvedValue([{}, []]) };
    await expect(ensureContentReleaseSchema(db)).rejects.toThrow('Could not inspect');
  });

  it('does not change existing migration definitions or unrelated release tables', () => {
    const source = readFileSync('server/services/contentReleaseSchemaService.ts', 'utf8');
    expect(source).not.toContain('artist_releases');
    expect(source).not.toContain('ALTER TABLE `users`');
    expect(source).not.toMatch(/CHANGE COLUMN|MODIFY COLUMN|DROP COLUMN/);
  });
});
