import fs from 'node:fs';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {ensureArtistReleaseDisclosureSchema,resetArtistReleaseDisclosureSchemaForTests} from './services/artistReleaseSchemaService';
const names=['aiUseDisclosureEnabled','aiUseLevel','aiUseComponents','aiUseTools','aiUseNotes'];
const rows=(n=names)=>[n.map(Field=>({Field})),[]];
describe('artist release disclosure runtime schema guard',()=>{
 beforeEach(()=>resetArtistReleaseDisclosureSchemaForTests());
 it('does not issue DDL when the declared optional columns already exist',async()=>{
  const db={execute:vi.fn().mockResolvedValue(rows())};await ensureArtistReleaseDisclosureSchema(db);await ensureArtistReleaseDisclosureSchema(db);
  expect(db.execute).toHaveBeenCalledTimes(1);expect(db.execute).toHaveBeenCalledWith('SHOW COLUMNS FROM `artist_releases`');
 });
 it('adds only missing disclosure columns with compatible syntax',async()=>{
  const db={execute:vi.fn().mockResolvedValueOnce(rows(names.slice(0,3))).mockResolvedValue([])};
  await ensureArtistReleaseDisclosureSchema(db);expect(db.execute).toHaveBeenCalledTimes(3);
  expect(db.execute.mock.calls[1][0]).toBe('ALTER TABLE `artist_releases` ADD COLUMN `aiUseTools` varchar(300)');
  const source=fs.readFileSync(new URL('./services/artistReleaseSchemaService.ts',import.meta.url),'utf8');
  expect(source).not.toContain('ADD COLUMN IF NOT EXISTS ${');expect(source).not.toMatch(/UPDATE |DELETE |DROP |TRUNCATE |release_purchases/);
 });
 it('coalesces concurrent requests but checks each database separately',async()=>{
  const a={execute:vi.fn().mockResolvedValue(rows())},b={execute:vi.fn().mockResolvedValue(rows())};
  await Promise.all([ensureArtistReleaseDisclosureSchema(a),ensureArtistReleaseDisclosureSchema(a),ensureArtistReleaseDisclosureSchema(b)]);
  expect(a.execute).toHaveBeenCalledTimes(1);expect(b.execute).toHaveBeenCalledTimes(1);
 });
 it('clears the cache on failure and retries the same database',async()=>{
  const db={execute:vi.fn().mockRejectedValueOnce(new Error('temporary inspection failure')).mockResolvedValue(rows())};
  await expect(ensureArtistReleaseDisclosureSchema(db)).rejects.toThrow('temporary inspection failure');
  await expect(ensureArtistReleaseDisclosureSchema(db)).resolves.toBeUndefined();expect(db.execute).toHaveBeenCalledTimes(2);
 });
 it('tolerates duplicate-column races but propagates unrelated DDL failure',async()=>{
  const db={execute:vi.fn().mockResolvedValueOnce(rows([])).mockRejectedValue(Object.assign(new Error('race'),{code:'ER_DUP_FIELDNAME'}))};
  await expect(ensureArtistReleaseDisclosureSchema(db)).resolves.toBeUndefined();expect(db.execute).toHaveBeenCalledTimes(6);
  const bad={execute:vi.fn().mockResolvedValueOnce(rows([])).mockRejectedValue(new Error('permission denied'))};
  await expect(ensureArtistReleaseDisclosureSchema(bad)).rejects.toThrow('permission denied');
 });
 it('rejects invalid inspection results instead of caching false readiness',async()=>{
  const db={execute:vi.fn().mockResolvedValue([undefined])};await expect(ensureArtistReleaseDisclosureSchema(db)).rejects.toThrow('Could not inspect');
 });
});
