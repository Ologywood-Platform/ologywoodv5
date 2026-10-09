import sharp from 'sharp';
import { TRPCError } from '@trpc/server';
import { CONTENT_RELEASE_COVER_MAX_BYTES, CONTENT_RELEASE_COVER_MIME_TYPES } from '../../shared/contentReleaseCover';

const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 12_000;
const badImage = () => new TRPCError({code:'BAD_REQUEST', message:'This image could not be read. Please choose a valid JPG, PNG, or WebP file.'});

export async function prepareContentReleaseCover(fileData: string, mimeType: string) {
  if (!(CONTENT_RELEASE_COVER_MIME_TYPES as readonly string[]).includes(mimeType)) throw badImage();
  const header = /^data:([^;,]+);base64,/.exec(fileData);
  if (fileData.startsWith('data:') && (!header || header[1] !== mimeType)) throw badImage();
  const encoded = header ? fileData.slice(header[0].length) : fileData;
  if (encoded.length > Math.ceil(CONTENT_RELEASE_COVER_MAX_BYTES / 3) * 4) {
    throw new TRPCError({code:'BAD_REQUEST', message:'Cover art must be 10 MB or smaller.'});
  }
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw badImage();
  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length > CONTENT_RELEASE_COVER_MAX_BYTES) throw new TRPCError({code:'BAD_REQUEST', message:'Cover art must be 10 MB or smaller.'});
  if (buffer.toString('base64') !== encoded) throw badImage();
  try {
    const metadata = await sharp(buffer, {limitInputPixels:MAX_PIXELS, failOn:'warning'}).metadata();
    const expected = mimeType === 'image/jpeg' ? 'jpeg' : mimeType === 'image/png' ? 'png' : 'webp';
    if (metadata.format !== expected || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw badImage();
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION || metadata.width * metadata.height > MAX_PIXELS) {
      throw new TRPCError({code:'BAD_REQUEST', message:'This image is too large in dimensions. Please resize it to 12,000 pixels per side or smaller.'});
    }
    // No crop, no enlargement, preserve transparency; EXIF/GPS are not retained.
    const {data, info} = await sharp(buffer, {limitInputPixels:MAX_PIXELS, failOn:'warning'})
      .rotate().resize(1600, 1600, {fit:'inside', withoutEnlargement:true})
      .webp({quality:90, alphaQuality:100}).toBuffer({resolveWithObject:true});
    return {data, mimeType:'image/webp' as const, width:info.width, height:info.height};
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw badImage();
  }
}
