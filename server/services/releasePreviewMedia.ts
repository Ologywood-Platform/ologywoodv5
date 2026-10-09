import { spawn } from 'node:child_process';
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TRPCError } from '@trpc/server';
import { storageGet, storagePut } from '../storage';
import { MAX_SECONDS, MAX_BYTES, MAX_INPUT_SECONDS } from '../../shared/releasePreview';

export const PREVIEW_SECONDS = MAX_SECONDS;
export const PREVIEW_INPUT_BYTES = MAX_BYTES;
export const PREVIEW_ERROR = 'We could not prepare this preview. Please use a valid audio or video file and try again.';
type PreviewKind = 'audio' | 'video';
type PreviewReference = { version: 1; userId: number; key: string; kind: PreviewKind; durationSeconds: number };
let active = false;

async function run(command: 'ffmpeg' | 'ffprobe', args: string[], timeout = 45_000): Promise<string> {
 return new Promise((resolve, reject) => {
  const process = spawn(command, args, {shell:false,stdio:['ignore','pipe','pipe']});
  let output = ''; let diagnostic = ''; let timedOut = false;
  process.stdout.on('data', b => {output = (output + b.toString()).slice(-16000);});
  process.stderr.on('data', b => {diagnostic = (diagnostic + b.toString()).slice(-1000);});
  const timer = setTimeout(() => {timedOut = true;process.kill('SIGKILL');},timeout);
  process.once('error', () => {clearTimeout(timer);reject(new TRPCError({code:'INTERNAL_SERVER_ERROR',message:PREVIEW_ERROR}));});
  process.once('close', code => {clearTimeout(timer);code === 0 && !timedOut ? resolve(output) : reject(new TRPCError({code:'BAD_REQUEST',message:PREVIEW_ERROR}));});
 });
}
async function probe(path: string) {
 const result = JSON.parse(await run('ffprobe',['-v','error','-protocol_whitelist','file,pipe','-format_whitelist','mp3,wav,flac,aac,mov,matroska,webm,ogg','-show_entries','format=duration,format_name:stream=codec_type,width,height','-of','json',path],15_000));
 const duration = Number(result.format?.duration);
 const streams = result.streams as Array<{codec_type:string;width?:number;height?:number}> | undefined;
 const formats = String(result.format?.format_name || '').split(',');
 if(!formats.some(format=>['mp3','wav','flac','aac','mov','mp4','m4a','3gp','3g2','mj2','matroska','webm','ogg'].includes(format)) || !streams?.length || !Number.isFinite(duration) || duration <= 0) throw new TRPCError({code:'BAD_REQUEST',message:PREVIEW_ERROR});
 return {duration,streams};
}
/** Only local, validated bytes reach FFmpeg. Never pass a user URL or full paid URL to a public player. */
export async function clipReleasePreview(source: Buffer, options: {audioOnly?:boolean;maxBytes?:number;maxInputSeconds?:number} = {}) {
 if (!source.length || source.length > (options.maxBytes ?? PREVIEW_INPUT_BYTES)) throw new TRPCError({code:'BAD_REQUEST',message:'Preview source is too large or empty.'});
 // Reject text playlists and SVG before FFmpeg can interpret local-file references.
 const prefix = source.subarray(0,512).toString('utf8').trimStart();
 if (/^(#EXTM3U|\[playlist\]|<|file |ffconcat)/i.test(prefix)) throw new TRPCError({code:'BAD_REQUEST',message:PREVIEW_ERROR});
 if(active) throw new TRPCError({code:'TOO_MANY_REQUESTS',message:'Another preview is being prepared. Please retry in a moment.'});
 active = true;
 let folder: string | undefined;
 try {
  folder = await mkdtemp(join(tmpdir(),'ology-release-preview-'));
  const input = join(folder,'source');await writeFile(input,source,{mode:0o600});
  const info = await probe(input);
  if(info.duration > (options.maxInputSeconds ?? MAX_INPUT_SECONDS)) throw new TRPCError({code:'BAD_REQUEST',message:'Use a preview source no longer than five minutes. The first 30 seconds will be used.'});
  const video = info.streams.find(s=>s.codec_type==='video');const audio = info.streams.some(s=>s.codec_type==='audio');
  if(options.audioOnly && !audio || !video && !audio) throw new TRPCError({code:'BAD_REQUEST',message:'This file does not contain playable audio or video.'});
  if(video && ((video.width??0)*(video.height??0)>16_777_216 || (video.width??0)<1 || (video.height??0)<1)) throw new TRPCError({code:'BAD_REQUEST',message:'Use a preview video at 4K resolution or lower.'});
  const kind:PreviewKind = options.audioOnly || !video ? 'audio':'video';
  const output = join(folder,kind==='audio'?'preview.mp3':'preview.mp4');
  const args = ['-nostdin','-hide_banner','-loglevel','error','-y','-protocol_whitelist','file,pipe','-format_whitelist','mp3,wav,flac,aac,mov,matroska,webm,ogg','-i',input,'-t',String(PREVIEW_SECONDS),'-map_metadata','-1','-sn','-dn','-threads','1','-filter_threads','1'];
  if(kind==='audio') args.push('-map','0:a:0','-vn','-c:a','libmp3lame','-b:a','128k','-ar','44100','-ac','2');
  else args.push('-map','0:v:0','-map','0:a:0?','-vf','scale=w=min(1280\\,iw):h=min(1280\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','26','-maxrate','2M','-bufsize','4M','-c:a','aac','-b:a','96k','-movflags','+faststart');
  args.push('-fs',String(PREVIEW_INPUT_BYTES),output);await run('ffmpeg',args);
  const outputInfo = await probe(output);const size = (await stat(output)).size;
  // Encoder padding is tolerated only below 0.1 seconds; output never contains the original file.
  if(outputInfo.duration>PREVIEW_SECONDS+0.1 || size<1 || size>PREVIEW_INPUT_BYTES) throw new TRPCError({code:'BAD_REQUEST',message:PREVIEW_ERROR});
  return {data:await readFile(output),kind,durationSeconds:Math.min(PREVIEW_SECONDS,outputInfo.duration),mimeType:kind==='audio'?'audio/mpeg':'video/mp4',extension:kind==='audio'?'mp3':'mp4'};
 } finally {active=false;if(folder)await rm(folder,{recursive:true,force:true}).catch(()=>undefined);}
}
export function decodePreviewUpload(fileData:string):Buffer {
 const base64 = fileData.includes(',') ? fileData.slice(fileData.indexOf(',')+1):fileData;
 if(!base64 || base64.length>Math.ceil(PREVIEW_INPUT_BYTES/3)*4+4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new TRPCError({code:'BAD_REQUEST',message:'Use a valid audio or video file up to 20 MB.'});
 const buffer=Buffer.from(base64,'base64');if(buffer.toString('base64')!==base64)throw new TRPCError({code:'BAD_REQUEST',message:PREVIEW_ERROR});return buffer;
}
function secret(){const value=process.env.JWT_SECRET;if(!value)throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:PREVIEW_ERROR});return value;}
export function signPreviewReference(reference:PreviewReference):string {
 const payload=Buffer.from(JSON.stringify(reference)).toString('base64url');
 return `${payload}.${createHmac('sha256',secret()).update('release-preview:'+payload).digest('base64url')}`;
}
export function readPreviewReference(token:string,userId?:number):PreviewReference {
 try {
  const [payload,signature,...extra]=token.split('.');if(!payload||!signature||extra.length)throw new Error();
  const expected=createHmac('sha256',secret()).update('release-preview:'+payload).digest();const actual=Buffer.from(signature,'base64url');
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new Error();
  const data=JSON.parse(Buffer.from(payload,'base64url').toString()) as PreviewReference;
  if(data.version!==1 || !Number.isInteger(data.userId) || data.userId<1 || (userId!==undefined&&data.userId!==userId) || !['audio','video'].includes(data.kind) || !Number.isFinite(data.durationSeconds) || data.durationSeconds<=0 || data.durationSeconds>PREVIEW_SECONDS || !new RegExp(`^release-previews/hosted/${data.userId}/[a-f0-9-]+\\.(mp3|mp4)$`).test(data.key)) throw new Error();
  return data;
 } catch {throw new TRPCError({code:'BAD_REQUEST',message:'Please upload this release preview from your own account again.'});}
}
export async function uploadHostedPreview(userId:number,fileData:string,mimeType:string) {
 const clipped=await clipReleasePreview(decodePreviewUpload(fileData),{audioOnly:mimeType.startsWith('audio/')});
 const key=`release-previews/hosted/${userId}/${randomUUID()}.${clipped.extension}`;
 const uploaded=await storagePut(key,clipped.data,clipped.mimeType);
 return {previewMedia:signPreviewReference({version:1,userId,key,kind:clipped.kind,durationSeconds:clipped.durationSeconds}),previewUrl:uploaded.url,kind:clipped.kind,durationSeconds:clipped.durationSeconds};
}
export async function resolveHostedPreview(token:string,userId:number) {
 const reference=readPreviewReference(token,userId);const {url}=await storageGet(reference.key);
 return {previewUrl:url,kind:reference.kind,durationSeconds:reference.durationSeconds};
}
const musicPreviews = new Map<string,Promise<string>>();
async function downloadStoredSource(key:string):Promise<Buffer> {
 // Key comes exclusively from an existing release record or the authenticated upload path.
 const {url}=await storageGet(key);const parsed=new URL(url);
 if(parsed.protocol!=='https:')throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:PREVIEW_ERROR});
 const response=await fetch(url,{signal:AbortSignal.timeout(30_000)});
 if(!response.ok||!response.body||Number(response.headers.get('content-length'))>50*1024*1024)throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:PREVIEW_ERROR});
 const chunks:Buffer[]=[];let total=0;const reader=response.body.getReader();
 try {while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>50*1024*1024)throw new TRPCError({code:'BAD_REQUEST',message:'Music source exceeds the 50 MB limit.'});chunks.push(Buffer.from(value));}}
 finally {await reader.cancel().catch(()=>undefined);}
 return Buffer.concat(chunks);
}
export async function getMusicPreview(sourceKey:string):Promise<string> {
 const cacheKey=createHash('sha256').update('v1-30sec:'+sourceKey).digest('hex');
 const destination=`release-previews/music/${cacheKey}.mp3`;
 let pending=musicPreviews.get(cacheKey);
 if(!pending){
  pending=(async()=>{
   const candidate=await storageGet(destination);
   const exists=await fetch(candidate.url,{method:'HEAD',signal:AbortSignal.timeout(10_000)}).catch(()=>null);
   if(!exists?.ok){const clipped=await clipReleasePreview(await downloadStoredSource(sourceKey),{audioOnly:true,maxBytes:50*1024*1024,maxInputSeconds:7200});await storagePut(destination,clipped.data,'audio/mpeg');}
   return destination;
  })().catch(error=>{musicPreviews.delete(cacheKey);throw error;});
  if(musicPreviews.size>=250)musicPreviews.delete(musicPreviews.keys().next().value!);
  musicPreviews.set(cacheKey,pending);
 }
 return (await storageGet(await pending)).url;
}
