import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./db', () => mocks);
import { setTeamRiderPermission } from './services/riderTeamPermissionService';
function fixture(options: { profile?: boolean; nonOwner?: boolean; changed?: boolean; corrupt?: boolean; auditFail?: boolean; ownerMember?: boolean } = {}) {
 const member={id:44,userId:9,artistProfileId:11,teamRole:options.ownerMember?'owner':'manager',permissions:options.corrupt?'invalid json':JSON.stringify({manageBookings:true,manageTeam:false,uploadMedia:true,manageRiders:false})};
 const connection:any={query:vi.fn(),beginTransaction:vi.fn(),commit:vi.fn(),rollback:vi.fn(),release:vi.fn()};
 connection.execute=vi.fn(async (sql:string,params:any[])=>{
  if(sql==='SELECT id, userId, artistProfileId FROM artist_team_members WHERE id = ? LIMIT 1')return [[member]];
  if(sql.startsWith('SELECT id FROM users WHERE id IN'))return [[{id:7},{id:9}]];
  if(sql.startsWith('SELECT id, userId FROM artist_profiles'))return [options.profile===false?[]:[{id:11,userId:7}]];
  if(sql.includes('teamRole <>'))return [options.nonOwner?[{id:6}]:[]];
  if(sql.startsWith('SELECT id, userId, artistProfileId, teamRole'))return [[{...member,userId:options.changed?10:9}]];
  if(sql.startsWith('UPDATE artist_team_members'))return [{affectedRows:1}];
  if(sql.startsWith('INSERT INTO artist_team_activity_log')){if(options.auditFail)throw new Error('synthetic audit outage');return [{insertId:3}];}
  throw new Error('Unexpected SQL '+sql);
 });
 mocks.getDb.mockResolvedValue({});mocks.getPool.mockReturnValue({getConnection:vi.fn(async()=>connection)});return connection;
}
describe('owner-controlled Manage Riders',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('locks users in order, persists a real boolean and preserves unrelated privileges',async()=>{
  const c=fixture();await expect(setTeamRiderPermission(7,44,true)).resolves.toEqual({success:true,manageRiders:true});
  const lock=c.execute.mock.calls.find((call:any[])=>call[0].startsWith('SELECT id FROM users WHERE id IN'));expect(lock[1]).toEqual([7,9]);
  const update=c.execute.mock.calls.find((call:any[])=>call[0].startsWith('UPDATE'));expect(JSON.parse(update[1][0])).toEqual({manageBookings:true,manageTeam:false,uploadMedia:true,manageRiders:true});
  expect(c.commit).toHaveBeenCalledOnce();expect(c.release).toHaveBeenCalledOnce();
 });
 it('revokes only rider access without changing the team role',async()=>{
  const c=fixture();await setTeamRiderPermission(7,44,false);const update=c.execute.mock.calls.find((call:any[])=>call[0].startsWith('UPDATE'));expect(JSON.parse(update[1][0]).manageRiders).toBe(false);expect(update[0]).not.toContain('teamRole =');
 });
 it.each([{profile:false},{nonOwner:true},{ownerMember:true}])('denies foreign/admin-only, collaborator and owner-role alteration %j',async o=>{
  const c=fixture(o);await expect(setTeamRiderPermission(7,44,true)).rejects.toMatchObject({code:'FORBIDDEN'});expect(c.commit).not.toHaveBeenCalled();expect(c.execute.mock.calls.some((x:any[])=>x[0].startsWith('UPDATE'))).toBe(false);
 });
 it('rechecks membership after shared locks before granting',async()=>{
  const c=fixture({changed:true});await expect(setTeamRiderPermission(7,44,true)).rejects.toMatchObject({code:'CONFLICT'});expect(c.commit).not.toHaveBeenCalled();
 });
 it.each([{corrupt:true},{auditFail:true}])('rolls back invalid permissions or audit failures without fabricated success %j',async o=>{
  const c=fixture(o);await expect(setTeamRiderPermission(7,44,true)).rejects.toMatchObject({code:'INTERNAL_SERVER_ERROR',message:'Team permissions temporarily unavailable'});expect(c.rollback).toHaveBeenCalledOnce();expect(c.commit).not.toHaveBeenCalled();expect(c.release).toHaveBeenCalledOnce();
 });
});
