import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({getDb:vi.fn(),getPool:vi.fn(),ensureSchema:vi.fn(),capture:vi.fn(),persist:vi.fn(),drizzle:vi.fn()}));
vi.mock('./db',()=>({getDb:mocks.getDb,getPool:mocks.getPool}));
vi.mock('./services/riderDocumentSchemaService',()=>({ensureRiderDocumentSchema:mocks.ensureSchema}));
vi.mock('./services/bookingRiderDocumentService',()=>({captureDefaultRiderDocumentForBooking:mocks.capture,persistDefaultRiderDocumentForBooking:mocks.persist}));
vi.mock('drizzle-orm/mysql2',()=>({drizzle:mocks.drizzle}));
import {createBookingWithRiderDocument} from './services/bookingRiderCreationService';
function fixture(changed=false){
 const c:any={query:vi.fn(),beginTransaction:vi.fn(),commit:vi.fn(),rollback:vi.fn(),release:vi.fn(),execute:vi.fn(async(sql:string)=>{
  if(sql.startsWith('SELECT id FROM users'))return [[{id:7},{id:20}]];
  if(sql.includes('artist_profiles'))return [[{userId:changed&&sql.includes('FOR UPDATE')?8:7}]];
  if(sql.includes('venue_profiles'))return [[{userId:20}]];
  throw new Error('Unexpected rawSQL');
 })};
 const values=vi.fn(async()=>[{insertId:101}]);const selectChain:any={from:()=>selectChain,where:()=>selectChain,limit:vi.fn(async()=>[{id:101,status:'pending',artistId:11,venueId:4}])};
 const db={insert:vi.fn(()=>({values})),select:vi.fn(()=>selectChain)};
 mocks.getDb.mockResolvedValue({});mocks.getPool.mockReturnValue({getConnection:vi.fn(async()=>c)});mocks.drizzle.mockReturnValue(db);mocks.capture.mockResolvedValue(null);mocks.persist.mockResolvedValue(undefined);
 return {c,db,values};
}
const data:any={artistId:11,venueId:4,eventDate:new Date('2026-11-01T00:00:00Z'),status:'pending',bookingSource:'venue',totalFee:'100.00',riderTemplateId:9};
describe('atomic default PDF on booking creation',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('keeps ordinary bookings and their supplied fields unchanged when no PDF default exists',async()=>{
  const f=fixture();await createBookingWithRiderDocument(data);expect(f.values).toHaveBeenCalledWith(data);expect(mocks.persist).not.toHaveBeenCalled();expect(f.c.commit).toHaveBeenCalledOnce();expect(f.c.release).toHaveBeenCalledOnce();
 });
 it('captures and persists the exact version on the same connection before committing the booking',async()=>{
  const f=fixture();const snapshot={documentId:3,versionId:5,ownerUserId:7,title:'Technical rider'};mocks.capture.mockResolvedValue(snapshot);
  await createBookingWithRiderDocument(data);expect(mocks.drizzle.mock.calls[0][0]).toBe(f.c);expect(mocks.capture).toHaveBeenCalledWith(f.c,11);expect(mocks.persist).toHaveBeenCalledWith(f.c,101,snapshot,7);expect(f.values).toHaveBeenCalledWith(data);
  const call=f.c.execute.mock.calls.find((x:any[])=>x[0].startsWith('SELECT id FROM users'));expect(call[1]).toEqual([7,20]);expect(f.c.commit).toHaveBeenCalledOnce();
 });
 it('rolls back both booking and attachment when storing the snapshot fails',async()=>{
  const f=fixture();mocks.capture.mockResolvedValue({documentId:3,versionId:5,ownerUserId:7,title:'Technical rider'});mocks.persist.mockRejectedValue(new Error('synthetic link outage'));
  await expect(createBookingWithRiderDocument(data)).rejects.toThrow('synthetic link outage');expect(f.c.commit).not.toHaveBeenCalled();expect(f.c.rollback).toHaveBeenCalledOnce();expect(f.c.release).toHaveBeenCalledOnce();
 });
 it('does not create a booking when default source validation fails',async()=>{
  const f=fixture();mocks.capture.mockRejectedValue(new Error('synthetic document source outage'));
  await expect(createBookingWithRiderDocument(data)).rejects.toThrow();expect(f.values).not.toHaveBeenCalled();expect(f.c.commit).not.toHaveBeenCalled();
 });
 it('fails closed on an ownership tuple change after user locks',async()=>{
  const f=fixture(true);await expect(createBookingWithRiderDocument(data)).rejects.toMatchObject({code:'CONFLICT'});expect(f.values).not.toHaveBeenCalled();
 });
 it('treats direct-client venueId as the other participant user ID',async()=>{
  const f=fixture();await createBookingWithRiderDocument({...data,bookingSource:'client_booking',venueId:31});const lock=f.c.execute.mock.calls.find((x:any[])=>x[0].startsWith('SELECT id FROM users'));expect(lock[1]).toEqual([7,31]);expect(f.c.execute.mock.calls.some((x:any[])=>x[0].includes('venue_profiles'))).toBe(false);
 });
});
