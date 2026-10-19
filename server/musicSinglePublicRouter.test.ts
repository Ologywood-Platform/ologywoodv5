import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>{
 class Unavailable extends Error {}
 return { publicSingle:vi.fn(),Unavailable };
});
vi.mock('./services/musicReleasePublicService',()=>({getPublicMusicSingle:mocks.publicSingle,PublicMusicReleaseUnavailableError:mocks.Unavailable}));
import { releaseRouter } from './routers/release';
const context=(user:any=null):any=>({user,req:{headers:{},ip:'127.0.0.1',method:'GET'},res:{clearCookie:vi.fn()}});
const dto={id:42,artistId:8,title:'Single',description:'Public description',artistName:'Creator',artistUrl:'/artist/creator',priceInCents:150,currency:'usd',allowPayWhatYouWant:false,coverArtUrl:null,hasPreview:true,durationSeconds:120,fileFormat:'mp3',publishedAt:null,totalSales:2};
describe('public single endpoint',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('serves the same minimal public DTO signed out and signed in as an admin owner',async()=>{
  mocks.publicSingle.mockResolvedValue(dto);
  expect(await releaseRouter.createCaller(context()).getPublicSingle({id:42})).toEqual(dto);
  expect(await releaseRouter.createCaller(context({id:12,role:'admin'})).getPublicSingle({id:42})).toEqual(dto);
  expect(mocks.publicSingle.mock.calls).toEqual([[42],[42]]);
 });
 it('never turns an owner/admin context into access to a private or missing single',async()=>{
  mocks.publicSingle.mockResolvedValue(null);
  for(const user of [null,{id:12,role:'admin'},{id:12,role:'artist'}])await expect(releaseRouter.createCaller(context(user)).getPublicSingle({id:42})).rejects.toMatchObject({code:'NOT_FOUND',message:'Release not found'});
 });
 it('maps source outages to a safe retryable error, not a false private/notfound result',async()=>{
  mocks.publicSingle.mockRejectedValue(new mocks.Unavailable('private database diagnostics'));
  await expect(releaseRouter.createCaller(context()).getPublicSingle({id:42})).rejects.toMatchObject({code:'INTERNAL_SERVER_ERROR',message:'Release temporarily unavailable'});
 });
 it.each([{id:0},{id:1.2},{id:Number.MAX_SAFE_INTEGER+1},{id:42,ownerId:12},{id:42,includePrivate:true}])('rejects malformed IDs or scope overrides %j',async input=>{
  await expect(releaseRouter.createCaller(context()).getPublicSingle(input as any)).rejects.toMatchObject({code:'BAD_REQUEST'});
  expect(mocks.publicSingle).not.toHaveBeenCalled();
 });
});
