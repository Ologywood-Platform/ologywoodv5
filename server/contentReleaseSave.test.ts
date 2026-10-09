import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTENT_RELEASE_TYPES, CONTENT_RELEASE_SAVE_ERROR, getContentReleaseErrorMessage, getContentReleaseTypeLabel } from '../shared/contentReleaseTypes';
import { resetContentReleaseSchemaForTests } from './services/contentReleaseSchemaService';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), subscription: vi.fn(), email: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getSubscriptionByUserId: mocks.subscription }));
vi.mock('./email', () => ({ sendReleasePurchaseConfirmationEmail: mocks.email }));
import { releasesRouter } from './routers/releases';
import { getCanonicalNavigationAnswer, SINGLE_RELEASE_GUIDANCE } from './routers/aiChat';

function database(selectRows: any[][] = []) {
  const execute = vi.fn().mockResolvedValue([[...['aiUseDisclosureEnabled', 'aiUseLevel', 'aiUseComponents', 'aiUseTools', 'aiUseNotes'].map(Field => ({Field}))], []]);
  const select = vi.fn(() => {
    const result = Promise.resolve(selectRows.shift() ?? []);
    const builder: any = { from: () => builder, where: () => builder, limit: () => builder, orderBy: () => builder, then: result.then.bind(result) };
    return builder;
  });
  const values = vi.fn().mockResolvedValue([{ insertId: 101 }]);
  const insert = vi.fn(() => ({ values }));
  const updateWhere = vi.fn().mockResolvedValue([{}]);
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));
  return { execute, select, insert, values, update, set, updateWhere };
}
const ctx = { user: { id: 7, role: 'artist', name: 'Test owner' }, req: {}, res: {} } as any;
const input = {
  title: 'Test single', releaseType: 'single', hostingPlatform: 'youtube', contentUrl: 'https://youtu.be/test-single',
  accessModel: 'pay_what_you_want', minPrice: 1.50, isPublished: false,
  aiUseDisclosureEnabled: true, aiUseLevel: 'ai_assisted' as const, aiUseComponents: ['artwork_graphics' as const], aiUseTools: 'Test tool',
};

describe('Content Release Single save workflow', () => {
  beforeEach(() => { vi.clearAllMocks(); resetContentReleaseSchemaForTests(); mocks.subscription.mockResolvedValue({tier:'professional'}); });

  it('exposes Single through the same catalog used for public labels', async () => {
    const options = await releasesRouter.createCaller(ctx).getOptions();
    expect(options.releaseTypes).toEqual(CONTENT_RELEASE_TYPES);
    expect(options.releaseTypes).toContainEqual({ value: 'single', label: 'Single' });
    expect(getContentReleaseTypeLabel('single')).toBe('Single');
    expect(getContentReleaseTypeLabel('other')).toBe('Other');
    expect(getContentReleaseTypeLabel('legacy_custom')).toBe('legacy_custom');
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('ensures schema before saving Single with AI disclosure and pay-what-you-want metadata', async () => {
    const db = database([[{id:11}], [{id:101, ...input}]]);
    mocks.getDb.mockResolvedValue(db);
    const result = await releasesRouter.createCaller(ctx).create(input);
    expect(result.releaseType).toBe('single');
    expect(db.execute.mock.invocationCallOrder[2]).toBeLessThan(db.select.mock.invocationCallOrder[0]);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({artistProfileId:11, userId:7, releaseType:'single', minPrice:'1.50', aiUseDisclosureEnabled:true, aiUseComponents:['artwork_graphics']}));
  });

  it('preserves Other and all original categories, including disclosure-off saves', async () => {
    const db = database([[{id:11}], [{id:101, releaseType:'other'}]]);
    mocks.getDb.mockResolvedValue(db);
    await releasesRouter.createCaller(ctx).create({...input, releaseType:'other', aiUseDisclosureEnabled:false});
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({releaseType:'other', aiUseDisclosureEnabled:false, aiUseComponents:[]}));
  });

  it('allows an owner to correct an existing Other release to Single without rewriting another record', async () => {
    const db = database([[{id:101, userId:7, releaseType:'other', aiUseDisclosureEnabled:false, accessModel:'pay_what_you_want', isPublished:true, includesLiveQA:true, includesBonusContent:true}], [{id:101, releaseType:'single'}]]);
    mocks.getDb.mockResolvedValue(db);
    await releasesRouter.createCaller(ctx).update({id:101, releaseType:'single'});
    expect(db.set).toHaveBeenCalledWith({releaseType:'single'});
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('rejects an update of another owner and prevents writes', async () => {
    const db = database([[]]);
    mocks.getDb.mockResolvedValue(db);
    await expect(releasesRouter.createCaller(ctx).update({id:202, releaseType:'single'})).rejects.toMatchObject({code:'NOT_FOUND'});
    expect(db.update).not.toHaveBeenCalled();
  });

  it('preserves free and Starter plan gates', async () => {
    mocks.subscription.mockResolvedValue({tier:'free'});
    const freeDb = database([[{id:11}]]);
    mocks.getDb.mockResolvedValue(freeDb);
    await expect(releasesRouter.createCaller(ctx).create(input)).rejects.toMatchObject({code:'FORBIDDEN'});
    expect(freeDb.insert).not.toHaveBeenCalled();
    mocks.subscription.mockResolvedValue({tier:'starter'});
    const starterDb = database([[{id:11}], [{id:1}, {id:2}]]);
    mocks.getDb.mockResolvedValue(starterDb);
    await expect(releasesRouter.createCaller(ctx).create(input)).rejects.toThrow('limited to 2 releases');
    expect(starterDb.insert).not.toHaveBeenCalled();
  });

  it('rejects signed-out creation before touching the database', async () => {
    await expect(releasesRouter.createCaller({...ctx, user:null}).create(input)).rejects.toMatchObject({code:'UNAUTHORIZED'});
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('masks SQL and user input in API errors while permitting a later retry', async () => {
    const db = database([[{id:11}], [{id:11}], [{id:101}]]);
    mocks.getDb.mockResolvedValue(db);
    db.values.mockRejectedValueOnce(new Error('Failed query: insert into releases params: private-title,private-link'));
    await expect(releasesRouter.createCaller(ctx).create(input)).rejects.toMatchObject({code:'INTERNAL_SERVER_ERROR', message:CONTENT_RELEASE_SAVE_ERROR});
    await expect(releasesRouter.createCaller(ctx).create(input)).resolves.toEqual({id:101});
    expect(db.values).toHaveBeenCalledTimes(2);
  });

  it('does not perform CRUD if schema readiness fails and reports a safe error', async () => {
    const db = database();
    mocks.getDb.mockResolvedValue(db);
    db.execute.mockRejectedValueOnce(new Error('Failed query: CREATE TABLE releases'));
    await expect(releasesRouter.createCaller(ctx).create(input)).rejects.toMatchObject({message:CONTENT_RELEASE_SAVE_ERROR});
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('validates database-bounded fields before persistence', async () => {
    await expect(releasesRouter.createCaller(ctx).create({...input, duration:'x'.repeat(51)})).rejects.toMatchObject({code:'BAD_REQUEST'});
    await expect(releasesRouter.createCaller(ctx).create({...input, genre:'x'.repeat(101)})).rejects.toMatchObject({code:'BAD_REQUEST'});
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('keeps safe validation messages but hides internal SQL in creator feedback', () => {
    expect(getContentReleaseErrorMessage({message:'Failed query: insert into releases'})).toBe(CONTENT_RELEASE_SAVE_ERROR);
    expect(getContentReleaseErrorMessage({message:'private SQL detail', data:{code:'INTERNAL_SERVER_ERROR'}})).toBe(CONTENT_RELEASE_SAVE_ERROR);
    expect(getContentReleaseErrorMessage({message:'Choose at least one component', data:null})).toBe('Choose at least one component');
  });

  it('keeps failed form entries, exposes retry feedback, and uses consistent Single icons', () => {
    const form = readFileSync('client/src/pages/ContentReleases.tsx','utf8');
    const errorBlock = form.slice(form.indexOf('function onSaveError'), form.indexOf('const createMutation'));
    expect(errorBlock).not.toContain('resetForm');
    expect(form).toContain('role="alert"');
    expect(form).toContain('options?.releaseTypes || CONTENT_RELEASE_TYPES');
    expect(form).toContain("case 'single': case 'album'");
    expect(readFileSync('client/src/components/ContentReleasesDisplay.tsx','utf8')).toContain('getContentReleaseTypeLabel(release.releaseType)');
    expect(readFileSync('client/src/pages/Help.tsx','utf8')).toContain('How do I release a single song?');
  });

  it('provides deterministic Single guidance for creators', () => {
    expect(getCanonicalNavigationAnswer('How do I release a single?')).toBe(SINGLE_RELEASE_GUIDANCE);
    expect(SINGLE_RELEASE_GUIDANCE).toContain('Music Releases instead');
  });
});
