import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareContentReleaseCover } from './services/contentReleaseCoverService';
import { CONTENT_RELEASE_COVER_MAX_BYTES, CONTENT_RELEASE_COVER_UPLOAD_ERROR, validateContentReleaseCoverFile } from '../shared/contentReleaseCover';
import { resetContentReleaseSchemaForTests } from './services/contentReleaseSchemaService';

const mocks = vi.hoisted(() => ({getDb:vi.fn(), subscription:vi.fn(), put:vi.fn()}));
vi.mock('./db', () => ({getDb:mocks.getDb, getSubscriptionByUserId:mocks.subscription}));
vi.mock('./storage', () => ({storagePut:mocks.put}));
vi.mock('./email', () => ({sendReleasePurchaseConfirmationEmail:vi.fn()}));
import { releasesRouter, contentReleaseCoverLimiter } from './routers/releases';
import { CONTENT_RELEASE_COVER_GUIDANCE, getCanonicalNavigationAnswer } from './routers/aiChat';

let png:Buffer;
beforeAll(async () => {png = await sharp({create:{width:32,height:16,channels:4,background:{r:35,g:25,b:200,alpha:0.6}}}).png().toBuffer();});
const ctx:any = {user:{id:7,role:'artist'},req:{},res:{}};
const baseInput = () => ({fileData:`data:image/png;base64,${png.toString('base64')}`,mimeType:'image/png' as const});
function database(rows:any[][] = []) {
  const execute=vi.fn().mockResolvedValue([[...['aiUseDisclosureEnabled','aiUseLevel','aiUseComponents','aiUseTools','aiUseNotes'].map(Field=>({Field}))],[]]);
  const select=vi.fn(() => {const result=Promise.resolve(rows.shift()??[]);const builder:any={from:()=>builder,where:()=>builder,limit:()=>builder,orderBy:()=>builder,then:result.then.bind(result)};return builder;});
  const values=vi.fn().mockResolvedValue([{insertId:101}]);
  const insert=vi.fn(()=>({values}));
  const set=vi.fn(()=>({where:vi.fn().mockResolvedValue([])}));
  const update=vi.fn(()=>({set}));
  return {execute,select,insert,values,update,set};
}
beforeEach(() => {vi.clearAllMocks();resetContentReleaseSchemaForTests();contentReleaseCoverLimiter.reset('7');mocks.subscription.mockResolvedValue({tier:'professional'});mocks.put.mockResolvedValue({key:'test',url:'https://media.example.test/cover.webp'});});

describe('Content Release cover bytes', () => {
  it.each(['png','jpeg','webp'] as const)('decodes and normalizes actual %s bytes', async format => {
    const data=await sharp(png).toFormat(format).toBuffer();
    const image=await prepareContentReleaseCover(data.toString('base64'), `image/${format}`);
    const metadata=await sharp(image.data).metadata();
    expect(metadata.format).toBe('webp');expect(metadata.width).toBe(32);expect(metadata.height).toBe(16);expect(metadata.exif).toBeUndefined();
  });
  it('preserves transparency and aspect ratio without cropping or enlarging', async () => {
    const image=await prepareContentReleaseCover(baseInput().fileData,'image/png');
    expect((await sharp(image.data).metadata()).hasAlpha).toBe(true);expect(image.width/image.height).toBe(2);
    const large=await sharp({create:{width:2000,height:1000,channels:3,background:'#111111'}}).png().toBuffer();
    const normalized=await prepareContentReleaseCover(large.toString('base64'),'image/png');
    expect([normalized.width,normalized.height]).toEqual([1600,800]);
  });
  it('applies EXIF rotation and removes embedded metadata', async () => {
    const jpg=await sharp(png).jpeg().withMetadata({orientation:6}).toBuffer();
    const normalized=await prepareContentReleaseCover(jpg.toString('base64'),'image/jpeg');
    const metadata=await sharp(normalized.data).metadata();
    expect([metadata.width,metadata.height]).toEqual([16,32]);expect(metadata.exif).toBeUndefined();
  });
  it('rejects scriptable images, false MIME claims, malformed data and invalid headers', async () => {
    await expect(prepareContentReleaseCover(Buffer.from('<svg></svg>').toString('base64'),'image/png')).rejects.toMatchObject({code:'BAD_REQUEST'});
    await expect(prepareContentReleaseCover(png.toString('base64'),'image/jpeg')).rejects.toMatchObject({code:'BAD_REQUEST'});
    await expect(prepareContentReleaseCover('!!!','image/png')).rejects.toMatchObject({code:'BAD_REQUEST'});
    await expect(prepareContentReleaseCover('data:image/webp;base64,'+png.toString('base64'),'image/png')).rejects.toMatchObject({code:'BAD_REQUEST'});
    await expect(prepareContentReleaseCover('data:image/png;utf8,test','image/png')).rejects.toMatchObject({code:'BAD_REQUEST'});
  });
  it('rejects actual animated covers and oversized dimensions', async () => {
    const pixels=Buffer.alloc(8*16*4);
    for (let i=0;i<8*16;i++) {pixels[i*4]=i<64?255:0;pixels[i*4+1]=i<64?0:255;pixels[i*4+3]=255;}
    const animated=await sharp(pixels,{raw:{width:8,height:16,channels:4,pageHeight:8}}).webp({loop:0,delay:[100,100]}).toBuffer();
    expect((await sharp(animated).metadata()).pages).toBe(2);
    await expect(prepareContentReleaseCover(animated.toString('base64'),'image/webp')).rejects.toMatchObject({code:'BAD_REQUEST'});
    const wide=await sharp({create:{width:12001,height:1,channels:3,background:'#111111'}}).png().toBuffer();
    await expect(prepareContentReleaseCover(wide.toString('base64'),'image/png')).rejects.toMatchObject({code:'BAD_REQUEST'});
  });
  it('enforces byte size before image decoding and validates empty files on the client', async () => {
    const tooLarge=Buffer.alloc(CONTENT_RELEASE_COVER_MAX_BYTES+1).toString('base64');
    await expect(prepareContentReleaseCover(tooLarge,'image/png')).rejects.toThrow('10 MB');
    expect(validateContentReleaseCoverFile({type:'image/svg+xml',name:'art.svg',size:10})).toContain('JPG');
    expect(validateContentReleaseCoverFile({type:'image/png',name:'art.png',size:0})).toContain('empty');
    expect(validateContentReleaseCoverFile({type:'image/png',name:'art.png',size:CONTENT_RELEASE_COVER_MAX_BYTES+1})).toContain('10 MB');
    expect(validateContentReleaseCoverFile({type:'',name:'art.jpg',size:100})).toBeNull();
  });
});

describe('Content Release owner-protected cover upload', () => {
  it('uploads optimized bytes under a random owner-bound key, without creating or modifying a release', async () => {
    const db=database([[{id:11}]]);mocks.getDb.mockResolvedValue(db);
    const result=await releasesRouter.createCaller(ctx).uploadCoverArt(baseInput());
    expect(result).toEqual({url:'https://media.example.test/cover.webp',width:32,height:16});
    expect(mocks.put).toHaveBeenCalledWith(expect.stringMatching(/^content-release-covers\/7\/[0-9a-f-]+\.webp$/),expect.any(Buffer),'image/webp');
    expect(db.insert).not.toHaveBeenCalled();expect(db.update).not.toHaveBeenCalled();
  });
  it('denies signed-out and non-creator uploads before touching storage', async () => {
    await expect(releasesRouter.createCaller({...ctx,user:null}).uploadCoverArt(baseInput())).rejects.toMatchObject({code:'UNAUTHORIZED'});
    await expect(releasesRouter.createCaller({...ctx,user:{id:7,role:'venue'}}).uploadCoverArt(baseInput())).rejects.toMatchObject({code:'FORBIDDEN'});
    expect(mocks.put).not.toHaveBeenCalled();expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it('denies missing creator profiles and foreign release IDs', async () => {
    mocks.getDb.mockResolvedValue(database([[]]));
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt(baseInput())).rejects.toMatchObject({code:'NOT_FOUND'});
    mocks.getDb.mockResolvedValue(database([[{id:11}],[]]));
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt({...baseInput(),releaseId:999})).rejects.toMatchObject({code:'NOT_FOUND'});
    expect(mocks.put).not.toHaveBeenCalled();
  });
  it('preserves create tier limits and allows owner cover edits without resetting an existing release', async () => {
    mocks.subscription.mockResolvedValue({tier:'free'});mocks.getDb.mockResolvedValue(database([[{id:11}]]));
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt(baseInput())).rejects.toMatchObject({code:'FORBIDDEN'});
    mocks.subscription.mockResolvedValue({tier:'starter'});mocks.getDb.mockResolvedValue(database([[{id:11}],[{id:1},{id:2}]]));
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt(baseInput())).rejects.toMatchObject({code:'FORBIDDEN'});
    const db=database([[{id:11}],[{id:101,userId:7}]]);mocks.getDb.mockResolvedValue(db);
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt({...baseInput(),releaseId:101})).resolves.toMatchObject({url:expect.any(String)});
    expect(db.update).not.toHaveBeenCalled();
  });
  it('masks storage details, leaves data untouched and supports retry', async () => {
    const db=database([[{id:11}],[{id:11}]]);mocks.getDb.mockResolvedValue(db);
    mocks.put.mockRejectedValueOnce(new Error('secret bucket storage diagnostics'));
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt(baseInput())).rejects.toMatchObject({message:CONTENT_RELEASE_COVER_UPLOAD_ERROR});
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt(baseInput())).resolves.toMatchObject({url:expect.any(String)});
    expect(db.update).not.toHaveBeenCalled();
  });
  it('rate limits per authenticated owner before allocating image-processing work', async () => {
    for(let i=0;i<10;i++) contentReleaseCoverLimiter.check('7');
    await expect(releasesRouter.createCaller(ctx).uploadCoverArt(baseInput())).rejects.toMatchObject({code:'TOO_MANY_REQUESTS'});
    expect(mocks.getDb).not.toHaveBeenCalled();expect(mocks.put).not.toHaveBeenCalled();
  });
  it('stores artwork on create and clears only artwork on a partial edit', async () => {
    const db=database([[{id:11}],[{id:101}]]);mocks.getDb.mockResolvedValue(db);
    await releasesRouter.createCaller(ctx).create({title:'Test',releaseType:'single',hostingPlatform:'youtube',contentUrl:'https://youtu.be/test',thumbnailUrl:'https://media.example.test/cover.webp'});
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({thumbnailUrl:'https://media.example.test/cover.webp'}));
    const editDb=database([[{id:101,userId:7,aiUseDisclosureEnabled:false}],[{id:101}]]);mocks.getDb.mockResolvedValue(editDb);
    await releasesRouter.createCaller(ctx).update({id:101,thumbnailUrl:''});
    expect(editDb.set).toHaveBeenCalledWith({thumbnailUrl:null});
  });
  it('rejects dangerous cover URL schemes before database access', async () => {
    await expect(releasesRouter.createCaller(ctx).update({id:101,thumbnailUrl:'javascript:alert(1)'})).rejects.toMatchObject({code:'BAD_REQUEST'});
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it('provides deterministic guidance and wires covers into create, edit, public and dashboard views', () => {
    expect(getCanonicalNavigationAnswer('How do I upload cover art for a single?')).toBe(CONTENT_RELEASE_COVER_GUIDANCE);
    expect(CONTENT_RELEASE_COVER_GUIDANCE).toContain('10 MB');
    const form=readFileSync('client/src/pages/ContentReleases.tsx','utf8');
    expect(form).toContain('setThumbnailUrl(release.thumbnailUrl');expect(form).toContain('thumbnailUrl,');expect(form).toContain('disabled={isUploadingCover');
    expect(readFileSync('client/src/components/ContentReleasesDisplay.tsx','utf8')).toContain('url={release.thumbnailUrl}');
    const upload=readFileSync('client/src/components/ContentReleaseCoverArt.tsx','utf8');
    expect(upload).toContain("event.target.value = ''");expect(upload).toContain('finally');expect(upload).toContain('if (!mounted.current) return');expect(upload).toContain('object-contain');
  });
});
