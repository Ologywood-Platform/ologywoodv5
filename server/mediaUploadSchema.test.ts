import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureMediaUploadSchema,resetMediaUploadSchemaForTests } from './services/mediaUploadSchemaService';
const jobs='id ownerUserId requestId fingerprint storageNonce purpose releaseId fileName mimeType fileSizeBytes chunkBytes chunkCount state attempts leaseToken leaseExpiresAt expiresAt result error createdAt updatedAt'.split(' ');
const receipts='id uploadId chunkIndex sha256 byteSize createdAt'.split(' ');
function fixture(missingNonce=false,missingUnique=false){const execute=vi.fn(async(query:any)=>{if(typeof query!=='string')return [[],[]];if(query.includes('SHOW COLUMNS'))return [(query.includes('worker_slots')?['id','leaseToken','leaseExpiresAt']:query.includes('jobs')?jobs.filter(c=>!missingNonce||c!=='storageNonce'):receipts).map(Field=>({Field})),[]];if(query.includes('SHOW INDEX')){const fields=query.includes('worker_slots')?[['id']]:query.includes('jobs')?[['id'],['ownerUserId','requestId']]:missingUnique?[]:[['uploadId','chunkIndex']];return [fields.flatMap((group,n)=>group.map((Column_name,i)=>({Column_name,Seq_in_index:i+1,Non_unique:0,Key_name:'unique'+n}))),[]];}throw new Error('Unexpected query');});return {execute};}
beforeEach(resetMediaUploadSchemaForTests);
describe('media upload additive schema guard',()=>{
 it('verifies required columns/indexes once per database object',async()=>{const db=fixture();await Promise.all([ensureMediaUploadSchema(db),ensureMediaUploadSchema(db)]);expect(db.execute).toHaveBeenCalledTimes(9);await ensureMediaUploadSchema(db);expect(db.execute).toHaveBeenCalledTimes(9);});
 it('fails closed on missing private nonce without altering existing data',async()=>{const db=fixture(true);await expect(ensureMediaUploadSchema(db)).rejects.toThrow('incomplete');expect(db.execute.mock.calls.filter(([q])=>typeof q==='string'&&/ALTER|UPDATE|INSERT|DELETE|DROP/.test(q))).toHaveLength(0);});
 it('requires a unique chunk receipt scope',async()=>{await expect(ensureMediaUploadSchema(fixture(false,true))).rejects.toThrow('unique indexes');});
 it('does not cache a failed check',async()=>{const db=fixture(true);await expect(ensureMediaUploadSchema(db)).rejects.toThrow();const before=db.execute.mock.calls.length;await expect(ensureMediaUploadSchema(db)).rejects.toThrow();expect(db.execute.mock.calls.length).toBeGreaterThan(before);});
});
